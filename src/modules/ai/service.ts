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
export function aiPayload(ctx: FinancialContext, recs: Recommendation[], combined: CombinedReport | null, currency = 'ARS') {
  return {
    fecha: ctx.today,
    moneda: currency,
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
    presupuestos: ctx.budgets.map((b) => ({ nombre: b.name, periodo: b.period, limite: b.amountCents / 100, gastado: b.spentCents / 100, usado: Number(b.pct.toFixed(2)), estado: b.state, dias_restantes: b.daysLeft, proyectado: b.projectedCents / 100 })),
    objetivos: ctx.goals.map((g) => ({ nombre: g.name, meta: g.targetCents / 100, ahorrado: g.savedCents / 100, fecha_objetivo: g.targetDate, estado: g.state, aporte_mensual_recomendado: g.recommendedMonthlyCents / 100 })),
    microgastos: { umbral: ctx.micro.thresholdCents / 100, este_mes: ctx.micro.thisMonth.totalCents / 100, cantidad_este_mes: ctx.micro.thisMonth.count, promedio_mensual: ctx.micro.monthlyAvgCents / 100, patrones: ctx.micro.patterns.slice(0, 5).map((m) => ({ patron: m.label, mensual: m.monthlyCents / 100, veces_por_mes: Number(m.countPerMonth.toFixed(1)) })) },
    pagos_recurrentes: { cantidad: ctx.recurringTotals.count, mensual: ctx.recurringTotals.monthlyCents / 100, suscripciones_mensual: ctx.recurringTotals.subscriptionsMonthlyCents / 100 },
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

// sube cuando cambia el prompt: invalida los resúmenes guardados
const PROMPT_VERSION = 'v2'

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
  user: { id: string; aiExternalEnabled: boolean; currency?: string },
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

  const payload = aiPayload(ctx, recs, combined, user.currency)
  const hash = createHash('sha256').update(`${PROMPT_VERSION}${JSON.stringify(payload)}`).digest('hex')

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
      user: `Datos del usuario (JSON):\n${JSON.stringify(payload)}\n\nDevolvé SOLO un JSON con esta forma:\n{"resumen": "máximo 2 frases cortas: lo más importante del mes y por qué pasó, con 1 o 2 números como mucho. No repitas el capital total ni enumeres todos los montos", "recomendaciones": [{"id": "mismo id", "problema": "una frase", "explicacion": "1 o 2 frases con sus datos", "accion": "una frase, concreta", "prioridad": "alta|media|baja"}], "proximas_semanas": "1 frase sobre lo que viene, o null"}\nIncluí todas las recomendaciones recibidas, en el orden de prioridad que te parezca.`,
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
export type AskTopic = 'general' | 'movimientos' | 'presupuestos' | 'objetivos' | 'estadisticas' | 'fugas' | 'proyeccion' | 'calendario' | 'alertas'
const TOPIC_HINT: Record<AskTopic, string> = {
  general: '',
  movimientos: 'La persona está viendo su lista de movimientos: priorizá gastos por categoría, comercios grandes y recurrentes.',
  presupuestos: 'La persona está viendo sus presupuestos: priorizá el estado de cada uno (usado, proyectado, días restantes).',
  objetivos: 'La persona está viendo sus objetivos de ahorro: priorizá avance, atraso y el aporte mensual recomendado.',
  estadisticas: 'La persona está viendo estadísticas y comparativas entre períodos: priorizá variaciones y tendencias.',
  fugas: 'La persona está viendo fugas de dinero: priorizá microgastos, suscripciones y patrones que se repiten.',
  proyeccion: 'La persona está viendo proyecciones: priorizá la previsión de fin de mes y la capacidad de ahorro. Aclarar que son estimaciones.',
  calendario: 'La persona está viendo el calendario de lo que viene: priorizá pagos próximos y hallazgos de las próximas semanas.',
  alertas: 'La persona está viendo sus alertas: priorizá qué conviene atender primero y por qué.',
}

export async function answerQuestion(user: { aiExternalEnabled: boolean; currency?: string }, ctx: FinancialContext, recs: Recommendation[], combined: CombinedReport | null, question: string, topic: AskTopic = 'general'): Promise<{ answer: string; engine: string }> {
  const engine = availableEngine()
  if (engine && user.aiExternalEnabled && ctx.hasData) {
    try {
      const text = await complete(engine, {
        system: `${SYSTEM}\nRespondé en 1 a 3 frases. Empezá con la respuesta directa a la pregunta, después, solo si hace falta, un dato o una acción. Si los datos no alcanzan para responder, decilo en una frase. Si es un saludo, saludá en una línea.`,
        json: false,
        maxTokens: 700,
        user: `${TOPIC_HINT[topic] ? `${TOPIC_HINT[topic]}\n` : ''}Datos del usuario (JSON):\n${JSON.stringify(aiPayload(ctx, recs, combined, user.currency))}\n\nPregunta: ${question.slice(0, 500)}`,
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
  if (/presupuest/.test(s)) {
    if (!ctx.budgets.length) return 'Todavía no creaste presupuestos. Armá uno en Presupuestos y te aviso cuando te acerques al límite.'
    const worst = [...ctx.budgets].sort((a, b) => b.pct - a.pct)[0]
    return `Tenés ${ctx.budgets.length} presupuestos. El más ajustado es ${worst.name}: usaste ${pct(worst.pct)} (${money(worst.spentCents)} de ${money(worst.amountCents)}), te quedan ${worst.daysLeft} días${worst.projectedOverOn ? ` y a este ritmo lo pasás el ${worst.projectedOverOn}` : ''}.`
  }
  if (/objetiv|meta/.test(s)) {
    if (!ctx.goals.length) return 'Todavía no tenés objetivos. Creá uno con monto y fecha en Objetivos y te digo cuánto aportar por mes.'
    const behind = ctx.goals.find((g) => g.state === 'behind' || g.state === 'overdue') ?? ctx.goals[0]
    return `${behind.name}: llevás ${money(behind.savedCents)} de ${money(behind.targetCents)} (${pct(behind.pct)}). Para llegar a tiempo tendrías que aportar ${money(behind.recommendedMonthlyCents)} por mes.`
  }
  if (/fuga|micro|chiquit|hormiga/.test(s)) return `Este mes llevás ${ctx.micro.thisMonth.count} microgastos por ${money(ctx.micro.thisMonth.totalCents)}. En promedio son ${money(ctx.micro.monthlyAvgCents)} por mes${ctx.micro.patterns[0] ? `; el patrón más grande es ${ctx.micro.patterns[0].label.toLowerCase()} (${money(ctx.micro.patterns[0].monthlyCents)}/mes)` : ''}.`
  if (/suscrip|recurrent/.test(s)) return `Tenés ${ctx.recurringTotals.count} pagos recurrentes por ${money(ctx.recurringTotals.monthlyCents)} al mes (${money(ctx.recurringTotals.annualCents)} al año). Solo suscripciones: ${money(ctx.recurringTotals.subscriptionsMonthlyCents)} por mes.`
  if (/fin de mes|cierro|termino el mes|saldo/.test(s)) return `Estimamos que cerrás el mes con ${money(ctx.forecast.endOfMonthBalanceCents)}. Hoy tenés ${money(ctx.forecast.balanceNowCents)}, faltan ${money(ctx.forecast.expectedFixedCents)} de pagos fijos y unos ${money(ctx.forecast.expectedVariableCents)} de gasto variable.`
  if (/proxim|semana|viaje|calendario/.test(s) && combined) return combined.summary
  if (/gast/.test(s)) return `Este mes gastaste ${money(ctx.month.expenseCents)}. Tu mayor categoría es ${ctx.categories[0]?.name.toLowerCase() ?? '—'} con ${money(ctx.categories[0]?.cents ?? 0)}.`
  return 'Sin IA externa configurada puedo responder sobre: gasto por categoría ("¿cuánto gasté en delivery?"), ahorro, suscripciones, saldo a fin de mes y próximas semanas.'
}
