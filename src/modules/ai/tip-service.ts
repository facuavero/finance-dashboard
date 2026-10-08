import { aiPayload } from './service'
import { availableEngine, complete } from './providers'
import { applicablePrompts, TIP_PROMPTS, type TipGoal, type TipNeeds } from '@/modules/insights/tip-prompts'
import type { FinancialContext } from '@/modules/analytics/context'
import type { Recommendation } from './rules'
import type { CombinedReport } from '@/modules/insights/combined'

export type AiTip = { text: string; goal: TipGoal; engine: string }

const SYSTEM = `Sos el asistente financiero de Caudal, una app de finanzas personales para Argentina.
Escribís UN tip del día para la persona, en español rioplatense (voseo), claro y directo.
Reglas:
- Máximo 2 frases cortas (unos 260 caracteres). Tiene que servir para hacer crecer su plata, gastar menos o tapar una fuga.
- Usá SOLO números del JSON de datos. No inventes montos, porcentajes ni fechas. Si el dato que pide el pedido no existe, usá el que más se parezca.
- Terminá con una acción concreta que pueda hacer hoy o esta semana.
- Los montos vienen en la moneda indicada en "moneda". Formato argentino: $42.000.
- Sobre inversiones no des asesoramiento personalizado ni nombres de productos.
- Si una suscripción es el tema, sugerí revisarla, nunca digas que hay que cancelarla.
- Texto plano. Sin markdown, sin comillas, sin emojis, sin saludos.`

const plain = (s: string) => s.replace(/\*\*|__|`|^["“]|["”]$/g, '').replace(/\s+/g, ' ').trim()

// el mismo pedido sobre los mismos datos no se vuelve a pagar: guarda por usuario, día, pedido y huella de los datos
const cache = new Map<string, AiTip>()
const MAX_CACHE = 500

const has = (ctx: FinancialContext): Record<TipNeeds, boolean> => ({
  objetivos: ctx.goals.length > 0,
  presupuestos: ctx.budgets.length > 0,
  recurrentes: ctx.recurringTotals.count > 0,
  micro: ctx.micro.thisMonth.count > 0 || ctx.micro.patterns.length > 0,
  categorias: ctx.categories.length > 0,
  ingresos: ctx.monthlyIncomeCents > 0,
})

/** elige uno de los 150 pedidos (solo los que tienen datos) y se lo manda a la IA con los datos de la persona. null si no hay IA o falla */
export async function generateTip(opts: { userId: string; currency: string; ctx: FinancialContext; recs: Recommendation[]; combined: CombinedReport | null; rand?: () => number }): Promise<AiTip | null> {
  const engine = availableEngine()
  if (!engine) return null
  const { ctx } = opts
  const pool = applicablePrompts(has(ctx))
  const rand = opts.rand ?? Math.random
  const chosen = (pool.length ? pool : TIP_PROMPTS)[Math.floor(rand() * (pool.length || TIP_PROMPTS.length))]
  const payload = aiPayload(ctx, opts.recs, opts.combined)
  const key = `${opts.userId}|${ctx.today}|${TIP_PROMPTS.indexOf(chosen)}|${Math.round(ctx.balanceCents / 100)}|${Math.round(ctx.month.expenseCents / 100)}`
  const hit = cache.get(key)
  if (hit) return hit
  try {
    const raw = await complete(engine, {
      system: SYSTEM,
      json: false,
      maxTokens: 220,
      user: `Datos del usuario (JSON):\n${JSON.stringify(payload)}\n\nPedido del tip: ${chosen.prompt}\n\nDevolvé solo el texto del tip.`,
    })
    const text = plain(raw)
    if (text.length < 20 || text.length > 420) return null
    const tip: AiTip = { text, goal: chosen.goal, engine: `${engine.label} · ${engine.model}` }
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!)
    cache.set(key, tip)
    return tip
  } catch (err) {
    console.error('[caudal] ia externa falló en el tip del día', err)
    return null
  }
}
