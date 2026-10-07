import { money, pct } from '@/lib/format'
import type { FinancialContext } from '@/modules/analytics/context'

export type Tip = { id: string; text: string; /** de dónde sale: la IA con tus datos, tus datos por reglas o un consejo general */ basis: 'ia' | 'datos' | 'general'; goal?: 'crecer' | 'gastar-menos' | 'fuga'; engine?: string }

const GENERAL: string[] = [
  'La regla 50/30/20 es un punto de partida: 50 % necesidades, 30 % gustos, 20 % ahorro. Ajustala a tu realidad, pero tené un número.',
  'Pagá primero lo que querés ahorrar. Si lo apartás el día que cobrás, no depende de la fuerza de voluntad a fin de mes.',
  'Un fondo de emergencia de 3 meses de gastos cambia cómo vivís los imprevistos. Guardalo separado de la plata del día a día.',
  'Antes de una compra grande, esperá 48 horas. Si después de dos días la querés igual, comprala sin culpa.',
  'Los microgastos no se sienten, pero se suman. Mirá la pestaña Fugas de dinero una vez por mes.',
  'Anotá el gasto en el momento. Cargarlo toma 5 segundos; reconstruirlo a fin de mes es imposible.',
  'Revisá tus suscripciones cada tres meses. La que no abriste en 30 días probablemente no la necesitás.',
  'Poné un presupuesto solo en las 2 o 3 categorías que más te cuestan controlar. Con todas a la vez no se sostiene.',
  'En cuotas sin interés el precio es el mismo, pero comprometés plata futura. Sumá las cuotas que ya tenés antes de agregar otra.',
  'Cobrar aguinaldo o un extra no es plata libre. Decidí su destino el día que entra, antes de que se mezcle con el gasto diario.',
  'Un objetivo con fecha y monto se cumple más que un "quiero ahorrar". Creá uno en Objetivos.',
  'Si ahorrás en una moneda distinta a la que gastás, tu plata se mueve aunque no hagas nada. Tenelo presente al planificar.',
  'Los gastos anuales (seguros, patentes, vacaciones) dividilos por 12 y apartá esa parte todos los meses.',
  'Gastar menos en delivery casi siempre es el recorte más fácil: no cambia tu rutina, solo el lugar donde cocinás.',
  'Comparar el mes contra el anterior sirve menos que compararlo contra tu promedio de 3 meses. Un mes raro no es una tendencia.',
  'Usá efectivo o una tarjeta distinta para los gustos. Cuando se acaba lo asignado, se acabó el mes de gustos.',
  'No inviertas plata que vas a necesitar en menos de un año. El corto plazo se resuelve con liquidez, no con riesgo.',
  'Revisá el resumen de la tarjeta línea por línea una vez al mes. Siempre aparece algo que no recordabas.',
  'Un día sin gastos por semana no te cambia la vida, pero te muestra cuánto de tu gasto es automático.',
  'Antes de pedirle a la IA qué recortar, mirá tus 3 categorías más grandes. Ahí está casi todo el margen.',
  'Poné el monto de tus gastos fijos en una cuenta aparte el día que cobrás. Lo que queda en la otra es tu plata para gastar.',
  'Si un gasto se repite todos los meses, marcalo como recurrente. Caudal lo cuenta en el calendario y en la proyección.',
  'Las tasas de las tarjetas son altas: si podés pagar el total, pagalo. El mínimo es la forma más cara de financiarte.',
  'Hablá de plata con quien comparte tus gastos. La mayoría de las discusiones son por falta de números a la vista.',
]

const contextual = (ctx: FinancialContext): Tip[] => {
  const out: Tip[] = []
  if (!ctx.hasData) return out
  const subs = ctx.recurringTotals.subscriptionsMonthlyCents
  if (subs > 0) out.push({ id: 'ctx-subs', basis: 'datos', text: `Tus suscripciones suman ${money(subs)} por mes (${money(subs * 12)} al año). Revisá cuáles usaste en los últimos 30 días.` })
  const top = ctx.categories[0]
  if (top && top.pct >= 0.3) out.push({ id: 'ctx-top', basis: 'datos', text: `${top.name} es el ${pct(top.pct)} de tus gastos este mes. Si querés recortar, empezá por ahí: un 10 % menos acá pesa más que cualquier otra categoría.` })
  if (ctx.micro.thisMonth.count >= 8) out.push({ id: 'ctx-micro', basis: 'datos', text: `Llevás ${ctx.micro.thisMonth.count} microgastos este mes, por ${money(ctx.micro.thisMonth.totalCents)}. Mirá cuáles se repiten en Fugas de dinero.` })
  if (ctx.monthlyExpenseCents > 0 && ctx.balanceCents > ctx.monthlyExpenseCents * 6) out.push({ id: 'ctx-fund', basis: 'datos', text: `Tu capital cubre más de 6 meses de gastos. Ya podés pensar qué parte dejar quieta como respaldo y qué parte hacer trabajar.` })
  if (ctx.monthlyExpenseCents > 0 && ctx.balanceCents < ctx.monthlyExpenseCents) out.push({ id: 'ctx-low', basis: 'datos', text: `Tu capital está por debajo de un mes de gastos típicos (${money(ctx.monthlyExpenseCents)}). Armar un colchón chico es el primer paso antes de cualquier otro objetivo.` })
  if (ctx.forecast.endOfMonthBalanceCents < 0) out.push({ id: 'ctx-eom', basis: 'datos', text: `La estimación de cierre de mes da negativa. Mirá los pagos fijos que faltan en el calendario antes de hacer una compra grande.` })
  return out
}

/** un tip al azar por visita. mezcla consejos generales con los que salen de los datos de la persona (cuando aplican) */
export function pickTip(ctx: FinancialContext, rand: () => number = Math.random): Tip {
  const own = contextual(ctx)
  const pool: Tip[] = [...own, ...own, ...GENERAL.map((text, i) => ({ id: `g-${i}`, basis: 'general' as const, text }))] // los de datos pesan el doble
  return pool[Math.floor(rand() * pool.length)]
}
