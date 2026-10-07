import { createHash } from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'
import { type DB, schema } from '@/db/client'
import { newId } from '@/lib/ids'
import { money, pct } from '@/lib/format'
import type { FinancialContext } from '@/modules/analytics/context'
import type { CombinedReport } from '@/modules/insights/combined'
import { availableEngine, complete, parseJson } from './providers'
import { type Priority, type Recommendation, ruleSummary } from './rules'

export type AiReport = {
  engine: string // "reglas" o "gemini · gemini-2.5-flash"
  external: boolean
  generatedAt: string
  summary: string
  recommendations: Recommendation[]
  upcoming: string | null
  note: string | null
}

/**
 * lo único que sale hacia la ia externa. sin nombre, email, descripciones completas ni contenido de correos.
 * se muestra tal cual en la pantalla de privacidad.
 */
export function aiPayload(ctx: FinancialContext, recs: Recommendation[], combined: CombinedReport | null) {
  return {
    fecha: ctx.today,
    moneda: 'ARS',
    mes_en_curso: {
      ingresos: ctx.month.incomeCents / 100,
      gastos: ctx.month.expenseCents / 100,
      ahorro_neto: ctx.month.netCents / 100,
      tasa_ahorro: ctx.month.savingsRate,
      variacion_gastos_vs_mes_anterior: ctx.month.deltas.expense.pct,
    },
    capital_disponible: ctx.balanceCents / 100,
    ingreso_mensual_tipico: ctx.monthlyIncomeCents / 100,
    gasto_mensual_tipico: ctx.monthlyExpenseCents / 100,
    categorias_mes: ctx.categories.slice(0, 8).map((c) => ({ categoria: c.name, monto: c.cents / 100, porcentaje: Number(c.pct.toFixed(3)) })),
    prevision_fin_de_mes: ctx.forecast.endOfMonthBalanceCents / 100,
    capacidad_ahorro_mensual: ctx.capacity.capacityCents / 100,
    recomendaciones_calculadas: recs.map((r) => ({
      id: r.id,
      area: r.area,
      problema: r.problem,
      explicacion: r.explanation,
      accion: r.action,
      impacto_mensual: r.impactMonthlyCents !== null ? r.impactMonthlyCents / 100 : null,
      impacto_anual: r.impactAnnualCents !== null ? r.impactAnnualCents / 100 : null,
      prioridad: r.priority,
    })),
    proximas_semanas: combined ? { resumen: combined.summary, hallazgos: combined.findings.filter((f) => f.impact !== 'none').slice(0, 8).map((f) => ({ impacto: f.impact, titulo: f.title, monto: f.amountCents ? f.amountCents / 100 : null, estimado: f.estimated })) } : null,
  }
}

const SYSTEM = `Sos el asistente financiero de Caudal, una app de finanzas personales para Argentina.
Hablás en español rioplatense (voseo), claro y directo, sin jerga ni frases de relleno.
Reglas:
- Usá SOLO los números del JSON. No inventes montos, porcentajes ni fechas.
- No cambies los montos de impacto: vienen calculados.
- Explicá el razonamiento con los datos del usuario, nunca consejos genéricos.
- Si una recomendación es sobre una suscripción, sugerí revisarla. Nunca digas que hay que cancelarla.
- Las proyecciones son estimaciones, no garantías. Sobre inversiones no des asesoramiento personalizado ni nombres de productos concretos.
- Montos con formato argentino: $42.000.
- Sé conciso: andá directo al punto, sin introducciones ni repetir datos que no aportan.
- Texto plano. Sin markdown: nada de **, listas ni títulos.`

/** por si el modelo mete markdown igual: la pantalla muestra texto plano */
const plain = (s: string) => s.replace(/\*\*|__|`/g, '').trim()

type LlmOut = {
  resumen: string
  recomendaciones: { id: string; problema: string; explicacion: string; accion: string; prioridad: Priority }[]
  proximas_semanas?: string | null
}

export async function generateReport(
  db: DB,
  user: { id: string; aiExternalEnabled: boolean },
  ctx: FinancialContext,
  recs: Recommendation[],
  combined: CombinedReport | null,
  opts: { force?: boolean } = {},
): Promise<AiReport> {
  const base: AiReport = {
    engine: 'Motor de reglas local',
    external: false,
    generatedAt: new Date().toISOString(),
    summary: ruleSummary(ctx),
    recommendations: recs,
    upcoming: combined?.summary ?? null,
    note: null,
  }
  const engine = availableEngine()
  if (!ctx.hasData) return base
  if (!engine) return { ...base, note: 'Sin clave de IA configurada: las recomendaciones salen del motor de reglas local, con tus datos reales.' }
  if (!user.aiExternalEnabled) return { ...base, note: 'Desactivaste la IA externa en Privacidad. Todo se calcula en el servidor de Caudal.' }

  const payload = aiPayload(ctx, recs, combined)
  const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex')

  if (!opts.force) {
    const cached = await db
      .select()
      .from(schema.aiReports)
      .where(and(eq(schema.aiReports.userId, user.id), eq(schema.aiReports.inputHash, hash)))
      .orderBy(desc(schema.aiReports.createdAt))
      .limit(1)
    if (cached[0]) return cached[0].output as AiReport
  }

  try {
    const text = await complete(engine, {
      system: SYSTEM,
      json: true,
      user: `Datos del usuario (JSON):\n${JSON.stringify(payload)}\n\nDevolvé SOLO un JSON con esta forma:\n{"resumen": "máximo 2 frases cortas: qué pasó este mes y por qué", "recomendaciones": [{"id": "mismo id", "problema": "una frase", "explicacion": "1 o 2 frases con sus datos", "accion": "una frase, concreta", "prioridad": "alta|media|baja"}], "proximas_semanas": "1 frase sobre lo que viene, o null"}\nIncluí todas las recomendaciones recibidas, en el orden de prioridad que te parezca.`,
    })
    const out = parseJson<LlmOut>(text)
    const byId = new Map(recs.map((r) => [r.id, r]))
    const merged: Recommendation[] = []
    for (const r of out.recomendaciones ?? []) {
      const orig = byId.get(r.id)
      if (!orig) continue // ids inventados se descartan
      merged.push({
        ...orig, // impacto, evidencia y link quedan los calculados
        problem: plain(r.problema ?? '') || orig.problem,
        explanation: plain(r.explicacion ?? '') || orig.explanation,
        action: plain(r.accion ?? '') || orig.action,
        priority: ['alta', 'media', 'baja'].includes(r.prioridad) ? r.prioridad : orig.priority,
      })
      byId.delete(r.id)
    }
    merged.push(...byId.values()) // si la ia omitió alguna, se agrega la original
    const report: AiReport = {
      engine: `${engine.label} · ${engine.model}`,
      external: true,
      generatedAt: new Date().toISOString(),
      summary: plain(out.resumen ?? '') || base.summary,
      recommendations: merged,
      upcoming: plain(out.proximas_semanas ?? '') || base.upcoming,
      note: null,
    }
    await db.insert(schema.aiReports).values({ id: newId(), userId: user.id, engine: report.engine, inputHash: hash, output: report })
    return report
  } catch (err) {
    console.error('[caudal] ia externa falló', err)
    return { ...base, note: `${engine.label} no respondió. Se usó el motor de reglas local: los datos y montos son los mismos.` }
  }
}

/** preguntas libres. con ia: respuesta redactada sobre el mismo payload. sin ia: respuestas por reglas. */
export async function answerQuestion(user: { aiExternalEnabled: boolean }, ctx: FinancialContext, recs: Recommendation[], combined: CombinedReport | null, question: string): Promise<{ answer: string; engine: string }> {
  const engine = availableEngine()
  if (engine && user.aiExternalEnabled && ctx.hasData) {
    try {
      const text = await complete(engine, {
        system: `${SYSTEM}\nRespondé en 1 a 3 frases. Empezá con la respuesta directa a la pregunta, después, solo si hace falta, un dato o una acción. Si los datos no alcanzan para responder, decilo en una frase. Si es un saludo, saludá en una línea.`,
        json: false,
        maxTokens: 700,
        user: `Datos del usuario (JSON):\n${JSON.stringify(aiPayload(ctx, recs, combined))}\n\nPregunta: ${question.slice(0, 500)}`,
      })
      return { answer: plain(text), engine: `${engine.label} · ${engine.model}` }
    } catch (err) {
      console.error('[caudal] ia externa falló', err)
    }
  }
  return { answer: ruleAnswer(ctx, recs, combined, question), engine: 'Motor de reglas local' }
}

function ruleAnswer(ctx: FinancialContext, recs: Recommendation[], combined: CombinedReport | null, q: string): string {
  const s = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (!ctx.hasData) return 'Todavía no tengo movimientos tuyos para analizar. Cargá algunos gastos e ingresos y volvé a preguntar.'
  const cat = ctx.categories.find((c) => s.includes(c.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(' ')[0]))
  if (cat) return `Este mes llevás ${money(cat.cents)} en ${cat.name.toLowerCase()} (${pct(cat.pct)} de tus gastos, ${cat.count} movimientos).`
  if (/ahorr/.test(s)) return `Tu capacidad de ahorro típica es ${money(ctx.capacity.capacityCents)} por mes. Este mes llevás un ahorro neto de ${money(ctx.month.netCents)}${ctx.month.savingsRate !== null ? ` (${pct(ctx.month.savingsRate)} de lo que ingresó)` : ''}. ${recs[0] ? `Lo primero que cambiaría: ${recs[0].action}` : ''}`
  if (/suscrip|recurrent/.test(s)) return `Tenés ${ctx.recurringTotals.count} pagos recurrentes por ${money(ctx.recurringTotals.monthlyCents)} al mes (${money(ctx.recurringTotals.annualCents)} al año). Solo suscripciones: ${money(ctx.recurringTotals.subscriptionsMonthlyCents)} por mes.`
  if (/fin de mes|cierro|termino el mes|saldo/.test(s)) return `Estimamos que cerrás el mes con ${money(ctx.forecast.endOfMonthBalanceCents)}. Hoy tenés ${money(ctx.forecast.balanceNowCents)}, faltan ${money(ctx.forecast.expectedFixedCents)} de pagos fijos y unos ${money(ctx.forecast.expectedVariableCents)} de gasto variable.`
  if (/proxim|semana|viaje|calendario/.test(s) && combined) return combined.summary
  if (/gast/.test(s)) return `Este mes gastaste ${money(ctx.month.expenseCents)}. Tu mayor categoría es ${ctx.categories[0]?.name.toLowerCase() ?? '—'} con ${money(ctx.categories[0]?.cents ?? 0)}.`
  return 'Sin IA externa configurada puedo responder sobre: gasto por categoría ("¿cuánto gasté en delivery?"), ahorro, suscripciones, saldo a fin de mes y próximas semanas.'
}
