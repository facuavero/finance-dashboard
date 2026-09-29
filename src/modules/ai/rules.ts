import type { FinancialContext } from '@/modules/analytics/context'
import { money, pct, plural } from '@/lib/format'
import { daysBetween } from '@/modules/analytics/dates'

export type Priority = 'alta' | 'media' | 'baja'
export type Area = 'ahorro' | 'gastos' | 'inversion' | 'distribucion' | 'objetivos' | 'recurrentes' | 'microgastos' | 'anomalias'

export type Recommendation = {
  id: string
  area: Area
  problem: string
  explanation: string
  action: string
  impactMonthlyCents: number | null
  impactAnnualCents: number | null
  priority: Priority
  /** datos concretos que respaldan la recomendación (se muestran como "por qué") */
  evidence: string[]
  href: string | null
}

const REDUCE: Record<string, { pct: number; how: (perWeek: number) => string }> = {
  delivery: { pct: 0.4, how: (w) => `Pedir ${w >= 2 ? 'una vez menos por semana' : 'la mitad de las veces'} y cocinar esas noches` },
  coffee: { pct: 0.3, how: () => 'Llevar café o snack de casa 2 o 3 días por semana' },
  rides: { pct: 0.3, how: () => 'Reemplazar los viajes cortos por transporte público o bici' },
}

/**
 * recomendaciones calculadas con los datos reales del usuario. los montos salen de acá, no de la ia.
 * la ia (si está activa) solo reescribe explicaciones y puede reordenar prioridades.
 */
export function buildRecommendations(ctx: FinancialContext): Recommendation[] {
  const recs: Recommendation[] = []
  const income = ctx.monthlyIncomeCents
  const share = (cents: number) => (income > 0 ? cents / income : 0)

  // microgastos por patrón
  for (const p of ctx.micro.patterns.slice(0, 3)) {
    const rule = p.group ? REDUCE[p.group] : undefined
    const cut = rule?.pct ?? 0.25
    const monthly = Math.round(p.monthlyCents * cut)
    if (monthly < 5_000_00) continue
    recs.push({
      id: `micro:${p.key}`,
      area: 'microgastos',
      problem: `Detectamos ${money(p.monthlyCents)} mensuales en ${p.label.toLowerCase()}.`,
      explanation: `Son ${p.perWeek.toFixed(1).replace('.', ',')} compras por semana con un ticket promedio de ${money(p.avgTicketCents)}. Por separado no pesan, pero suman ${money(p.annualCents)} por año${p.pctOfIncome ? ` (${pct(p.pctOfIncome, { decimals: 1 })} de tu ingreso)` : ''}.`,
      action: `${rule?.how(p.perWeek) ?? 'Poné un tope semanal para este rubro'}. Reducirlo un ${Math.round(cut * 100)}% alcanza.`,
      impactMonthlyCents: monthly,
      impactAnnualCents: monthly * 12,
      priority: share(monthly) > 0.03 ? 'alta' : share(monthly) > 0.012 ? 'media' : 'baja',
      evidence: [`Ventana analizada: últimos 90 días`, `Comercios: ${p.merchants.join(', ')}`],
      href: '/fugas#microgastos',
    })
  }

  // gastos que individualmente parecen insignificantes
  if (ctx.micro.thisMonth.count >= 10) {
    const monthly = Math.round(ctx.micro.monthlyAvgCents * 0.25)
    recs.push({
      id: 'micro:total',
      area: 'microgastos',
      problem: `Gastaste ${money(ctx.micro.thisMonth.totalCents)} este mes en compras inferiores a ${money(ctx.micro.thresholdCents)}.`,
      explanation: `Fueron ${plural(ctx.micro.thisMonth.count, 'compra', 'compras')}. Tu promedio mensual en compras chicas es ${money(ctx.micro.monthlyAvgCents)}: ${money(ctx.micro.annualEstimateCents)} al año.`,
      action: 'Antes de cada compra chica, preguntate si la harías igual pagando el total del mes. Una regla simple: esperar 24 hs para compras online.',
      impactMonthlyCents: monthly,
      impactAnnualCents: monthly * 12,
      priority: share(ctx.micro.monthlyAvgCents) > 0.05 ? 'media' : 'baja',
      evidence: [`Umbral de microgasto: ${money(ctx.micro.thresholdCents)} (se cambia en configuración)`],
      href: '/fugas#microgastos',
    })
  }

  // suscripciones: suba de precio o superposición. nunca se asume que hay que cancelar.
  for (const r of ctx.recurring.filter((x) => x.kind === 'subscription' && x.priceChangePct && x.priceChangePct > 0.05)) {
    const extra = Math.round(r.lastCents - r.lastCents / (1 + r.priceChangePct!))
    recs.push({
      id: `sub-increase:${r.key}`,
      area: 'recurrentes',
      problem: `${r.label} subió ${pct(r.priceChangePct)}: ahora pagás ${money(r.lastCents)} por mes.`,
      explanation: `Son ${money(extra * 12)} más por año que antes del aumento. Las suscripciones suben sin aviso y se pagan solas.`,
      action: 'Revisá si el plan que tenés es el que necesitás. Muchos servicios tienen un plan más barato o con publicidad.',
      impactMonthlyCents: extra,
      impactAnnualCents: extra * 12,
      priority: 'media',
      evidence: [`Último cobro: ${money(r.lastCents)}`, `Próximo cobro: ${r.nextDate}`],
      href: '/fugas#recurrentes',
    })
  }
  const overlapping = ctx.recurring.filter((r) => r.kind === 'subscription' && r.reviewHint?.includes('streaming'))
  if (overlapping.length >= 3) {
    const cheapest = Math.min(...overlapping.map((r) => r.monthlyCents))
    const total = overlapping.reduce((a, r) => a + r.monthlyCents, 0)
    recs.push({
      id: 'sub-overlap:streaming',
      area: 'recurrentes',
      problem: `Pagás ${plural(overlapping.length, 'servicio', 'servicios')} de streaming: ${money(total)} por mes.`,
      explanation: `${overlapping.map((r) => r.label).join(', ')}. No sabemos cuánto usás cada uno: eso lo sabés vos.`,
      action: 'Si alguno lo usás poco, podés pausarlo y activarlo solo el mes que tenga algo que quieras ver.',
      impactMonthlyCents: cheapest,
      impactAnnualCents: cheapest * 12,
      priority: 'baja',
      evidence: [`El impacto asume pausar solo el más barato`],
      href: '/fugas#recurrentes',
    })
  }

  // anomalías por categoría. si un único movimiento explica el aumento, se muestra ese y no la categoría.
  const unusual = ctx.anomalies.filter((a) => a.kind === 'unusual_txn')
  const anomalyCats = new Set<string>()
  for (const a of ctx.anomalies) {
    if (a.kind === 'category_growth') {
      if (unusual.some((u) => u.kind === 'unusual_txn' && u.categoryName === a.name && u.amountCents >= a.extraCents * 0.6)) continue
      anomalyCats.add(a.categoryId)
      const budget = ctx.budgets.find((b) => b.categoryId === a.categoryId)
      recs.push({
        id: `anomaly:${a.categoryId}`,
        area: 'anomalias',
        problem: `Tu gasto en ${a.name.toLowerCase()} aumentó un ${pct(a.changePct)} respecto del promedio de los últimos 3 meses.`,
        explanation: `A esta altura del mes llevás ${money(a.currentCents)}. Lo habitual a esta fecha era ${money(a.baselineCents)}.`,
        action: `Si fue algo puntual, no hace falta cambiar nada. Si es un hábito nuevo, ponele un presupuesto a ${a.name.toLowerCase()}.`,
        impactMonthlyCents: a.extraCents,
        impactAnnualCents: a.extraCents * 12,
        priority: share(a.extraCents) > 0.04 ? 'alta' : 'media',
        evidence: [
          'Comparación al mismo día de cada mes, para no comparar medio mes contra meses completos',
          ...(budget ? [`Presupuesto de ${budget.name}: ${money(budget.spentCents)} de ${money(budget.amountCents)} (${pct(budget.pct)})`] : []),
        ],
        href: '/fugas#anomalias',
      })
    } else {
      recs.push({
        id: `anomaly-txn:${a.txnId}`,
        area: 'anomalias',
        problem: `${a.label}: ${money(a.amountCents)} es ${a.ratio.toFixed(0)} veces tu gasto típico en ${a.categoryName.toLowerCase()}.`,
        explanation: `El gasto típico en esa categoría es ${money(a.typicalCents)}.${a.isNewMerchant ? ' Además es un comercio nuevo para vos.' : ''}`,
        action: 'Confirmá que lo reconocés. Si fue planificado, está todo bien.',
        impactMonthlyCents: null,
        impactAnnualCents: null,
        priority: 'baja',
        evidence: [`Fecha: ${a.date}`],
        href: '/movimientos',
      })
    }
  }

  // presupuestos
  for (const b of ctx.budgets.filter((x) => x.state !== 'ok' && !(x.categoryId && anomalyCats.has(x.categoryId)))) {
    const over = b.spentCents - b.amountCents
    recs.push({
      id: `budget:${b.id}`,
      area: 'gastos',
      problem: b.state === 'over' ? `Pasaste el presupuesto de ${b.name.toLowerCase()} por ${money(over)} (${pct(b.pct)}).` : `El presupuesto de ${b.name.toLowerCase()} va al ${pct(b.pct)}${b.projectedOverOn ? ` y al ritmo actual se agota el ${Number(b.projectedOverOn.slice(8))}` : ''}.`,
      explanation: `Asignado ${money(b.amountCents)}, gastado ${money(b.spentCents)}. Pasó el ${pct(b.elapsedPct)} del período.`,
      action: b.state === 'over' ? 'Frená ese rubro lo que queda del período o ajustá el presupuesto si quedó corto.' : 'Bajá el ritmo esta semana para llegar al cierre dentro del límite.',
      impactMonthlyCents: b.state === 'over' ? over : Math.max(0, b.projectedCents - b.amountCents),
      impactAnnualCents: null,
      priority: b.state === 'over' ? 'alta' : 'media',
      evidence: [`Proyección al cierre: ${money(b.projectedCents)}`],
      href: '/presupuestos',
    })
  }

  // objetivos
  for (const g of ctx.goals.filter((x) => x.state === 'behind' || x.state === 'overdue')) {
    const days = daysBetween(ctx.today, g.targetDate)
    recs.push({
      id: `goal:${g.id}`,
      area: 'objetivos',
      problem: `"${g.name}" va atrasado: tenés ${money(g.savedCents)} de ${money(g.targetCents)} (${pct(g.pct)}).`,
      explanation: days > 0 ? `Quedan ${plural(days, 'día', 'días')} y faltan ${money(g.remainingCents)}. Para ir al día deberías tener ${money(g.expectedByNowCents)}.` : `La fecha objetivo ya pasó y faltan ${money(g.remainingCents)}.`,
      action: days > 45 ? `Aportá ${money(g.recommendedMonthlyCents)} por mes o mové la fecha objetivo.` : 'Con tan poco margen, conviene mover la fecha o bajar el monto objetivo.',
      impactMonthlyCents: null,
      impactAnnualCents: null,
      priority: 'alta',
      evidence: [`Aporte mensual recomendado: ${money(g.recommendedMonthlyCents)}`],
      href: '/objetivos',
    })
  }

  // cuotas que terminan: plata que se libera (una sola recomendación)
  const ending = ctx.recurring.filter((x) => x.installment && x.installment.remaining <= 3 && x.installment.remaining > 0)
  if (ending.length) {
    const freed = ending.reduce((a, r) => a + r.lastCents, 0)
    recs.push({
      id: 'installments-ending',
      area: 'distribucion',
      problem: ending.length === 1 ? `Te quedan ${plural(ending[0].installment!.remaining, 'cuota', 'cuotas')} de ${ending[0].label}.` : `Estás por terminar de pagar ${ending.length} compras en cuotas.`,
      explanation: `${ending.map((r) => `${r.label}: ${plural(r.installment!.remaining, 'cuota', 'cuotas')} de ${money(r.lastCents)}, termina en ${r.installment!.endsOn.slice(0, 7)}`).join('. ')}. En total se liberan ${money(freed)} por mes.`,
      action: 'Cuando terminen, programá ese mismo monto como aporte a un objetivo. No lo vas a extrañar porque ya estás acostumbrado a no tenerlo.',
      impactMonthlyCents: freed,
      impactAnnualCents: freed * 12,
      priority: 'media',
      evidence: ending.map((r) => `${r.label}: cuota ${r.installment!.current}/${r.installment!.total}`),
      href: '/objetivos',
    })
  }

  // tasa de ahorro vs capacidad
  const cap = ctx.capacity
  if (cap.months >= 2 && income > 0) {
    const rate = cap.capacityCents / cap.typicalIncomeCents
    if (rate < 0.2) {
      const target = Math.round(cap.typicalIncomeCents * 0.2 - cap.capacityCents)
      recs.push({
        id: 'saving-rate',
        area: 'ahorro',
        problem: `Tu capacidad de ahorro es ${pct(rate)} de tu ingreso.`,
        explanation: `Ingreso típico ${money(cap.typicalIncomeCents)}, fijos ${money(cap.fixedCents)}, variables ${money(cap.variableCents)}. Una referencia sana es ahorrar al menos 20%.`,
        action: `Para llegar a 20% te faltan ${money(target)} por mes. Empezá por las fugas de esta lista, que ya suman más de la mitad.`,
        impactMonthlyCents: target,
        impactAnnualCents: target * 12,
        priority: rate < 0.1 ? 'alta' : 'media',
        evidence: [`Promedio de los últimos ${cap.months} meses completos`],
        href: '/proyeccion',
      })
    }
  }

  // distribución 50/30/20 aproximada
  const needsGroups = new Set(['groceries', 'housing', 'utilities', 'transport', 'health', 'installments', 'education'])
  const needs = ctx.categories.filter((c) => c.group && needsGroups.has(c.group)).reduce((a, c) => a + c.cents, 0)
  const spent = ctx.categories.reduce((a, c) => a + c.cents, 0)
  const wants = spent - needs
  if (ctx.month.incomeCents > 0 && wants / ctx.month.incomeCents > 0.35) {
    const excess = Math.round(wants - ctx.month.incomeCents * 0.3)
    recs.push({
      id: 'distribution',
      area: 'distribucion',
      problem: `Este mes el ${pct(wants / ctx.month.incomeCents)} de tu ingreso fue a gastos no esenciales.`,
      explanation: `Esenciales (vivienda, servicios, súper, transporte, salud, cuotas): ${money(needs)}. No esenciales: ${money(wants)}. La regla 50/30/20 sugiere hasta 30% en no esenciales.`,
      action: 'No hace falta cumplirla exacto. Usala para decidir dónde recortar primero: siempre en lo no esencial.',
      impactMonthlyCents: excess,
      impactAnnualCents: null,
      priority: 'baja',
      evidence: ['Clasificación por categoría. Podés ajustar categorías en configuración.'],
      href: '/estadisticas',
    })
  }

  // inversión: plata quieta por encima del fondo de emergencia
  const emergency = ctx.monthlyExpenseCents * 3
  const idle = ctx.balanceCents - emergency
  if (ctx.monthlyExpenseCents > 0 && idle > ctx.monthlyExpenseCents * 0.5) {
    const annual = Math.round(idle * 0.04)
    recs.push({
      id: 'invest-idle',
      area: 'inversion',
      problem: `Tenés ${money(idle)} por encima de un fondo de emergencia de 3 meses.`,
      explanation: `Tu capital disponible es ${money(ctx.balanceCents)} y 3 meses de gastos son ${money(emergency)}. Esa diferencia quieta pierde contra la inflación.`,
      action: 'Evaluá moverla a una alternativa de bajo riesgo y liquidez rápida (cuenta remunerada, FCI money market o plazo fijo). No es asesoramiento financiero.',
      impactMonthlyCents: Math.round(annual / 12),
      impactAnnualCents: annual,
      priority: 'media',
      evidence: ['Impacto calculado con un rendimiento real supuesto de 4% anual. Es una estimación, no una garantía.'],
      href: '/proyeccion',
    })
  } else if (ctx.monthlyExpenseCents > 0 && ctx.balanceCents < ctx.monthlyExpenseCents * 1.5 && !ctx.goals.some((g) => g.kind === 'emergency')) {
    recs.push({
      id: 'emergency-fund',
      area: 'ahorro',
      problem: 'Tu colchón cubre menos de un mes y medio de gastos.',
      explanation: `Capital disponible ${money(ctx.balanceCents)}. Gastos mensuales típicos ${money(ctx.monthlyExpenseCents)}.`,
      action: 'Creá un objetivo "fondo de emergencia" por 3 meses de gastos y aportá aunque sea poco cada mes.',
      impactMonthlyCents: null,
      impactAnnualCents: null,
      priority: 'alta',
      evidence: [],
      href: '/objetivos?nuevo=1',
    })
  }

  const rank: Record<Priority, number> = { alta: 0, media: 1, baja: 2 }
  return recs.sort((a, b) => rank[a.priority] - rank[b.priority] || (b.impactAnnualCents ?? b.impactMonthlyCents ?? 0) - (a.impactAnnualCents ?? a.impactMonthlyCents ?? 0))
}

/** resumen del mes en 2-3 frases, sin ia */
export function ruleSummary(ctx: FinancialContext): string {
  if (!ctx.hasData) return 'Todavía no hay movimientos. Cargá tu primer gasto o ingreso y acá vas a ver qué pasó con tu plata este mes.'
  const m = ctx.month
  const parts: string[] = []
  const exp = m.deltas.expense.pct
  parts.push(
    `En lo que va del mes ingresaron ${money(m.incomeCents)} y gastaste ${money(m.expenseCents)}${exp !== null ? `, ${Math.abs(exp) < 0.03 ? 'casi igual que' : exp > 0 ? `${pct(exp)} más que` : `${pct(-exp)} menos que`} a esta altura del mes pasado` : ''}.`,
  )
  const top = ctx.categories[0]
  const growth = ctx.anomalies.find((a) => a.kind === 'category_growth')
  if (growth && growth.kind === 'category_growth') parts.push(`Lo que más se movió fue ${growth.name.toLowerCase()}: ${pct(growth.changePct, { sign: true })} contra tu promedio.`)
  else if (top) parts.push(`Tu mayor gasto fue ${top.name.toLowerCase()} (${pct(top.pct)} del total).`)
  const f = ctx.forecast
  parts.push(`Si seguís así, cerrás el mes con ${money(f.endOfMonthBalanceCents)} disponibles (estimado).`)
  return parts.join(' ')
}
