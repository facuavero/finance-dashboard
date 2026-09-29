import { type ISODate, addDays, addMonths, daysInMonth, startOfMonth } from '@/modules/analytics/dates'

// generador determinístico de datos de ejemplo, siempre relativo a "hoy" para que la demo se vea actual.

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type DemoTxn = {
  type: 'expense' | 'income'
  amountCents: number
  date: ISODate
  description: string
  cat: string
  sub?: string
  paymentMethod: string
  recurrence: 'none' | 'weekly' | 'monthly' | 'yearly'
  tags: string[]
}

export type DemoData = {
  initialBalanceCents: number
  transactions: DemoTxn[]
  budgets: { name: string; cat: string | null; period: 'weekly' | 'monthly' | 'yearly'; amountCents: number; goal?: string }[]
  goals: { key: string; name: string; kind: 'purchase' | 'travel' | 'emergency' | 'savings' | 'investment'; targetCents: number; savedCents: number; startDate: ISODate; targetDate: ISODate }[]
}

const $ = (pesos: number) => Math.round(pesos * 100)

export function generateDemoData(today: ISODate, months = 6, seed = 42): DemoData {
  const r = rng(seed)
  const between = (a: number, b: number) => a + (b - a) * r()
  const round = (v: number, to = 100) => Math.round(v / to) * to
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)]
  const tx: DemoTxn[] = []
  const add = (t: Omit<DemoTxn, 'tags' | 'paymentMethod' | 'recurrence'> & Partial<DemoTxn>) => {
    if (t.date > today) return
    tx.push({ paymentMethod: 'debito', recurrence: 'none', tags: [], ...t })
  }

  const first = addMonths(startOfMonth(today), -months)
  for (let m = 0; m <= months; m++) {
    const ms = addMonths(first, m)
    const dim = daysInMonth(ms)
    const day = (d: number) => addDays(ms, Math.min(d, dim) - 1)
    const isCurrent = m === months
    const monthsAgo = months - m

    // ingresos
    add({ type: 'income', amountCents: $(1_850_000 + (m >= 3 ? 120_000 : 0)), date: day(4), description: 'Sueldo Acme SA', cat: 'sueldo', paymentMethod: 'transferencia', recurrence: 'monthly' })
    if (m % 2 === 0) add({ type: 'income', amountCents: $(round(between(240_000, 410_000), 1000)), date: day(12), description: 'Diseño web freelance', cat: 'freelance', paymentMethod: 'transferencia', tags: ['freelance'] })
    add({ type: 'income', amountCents: $(round(between(9_000, 16_000))), date: day(28), description: 'Rendimiento cuenta remunerada', cat: 'rendimientos', paymentMethod: 'transferencia' })

    // fijos
    add({ type: 'expense', amountCents: $(520_000), date: day(5), description: 'Alquiler depto', cat: 'hogar', sub: 'alquiler', paymentMethod: 'transferencia', recurrence: 'monthly' })
    add({ type: 'expense', amountCents: $(round(between(94_000, 101_000))), date: day(10), description: 'Expensas consorcio', cat: 'hogar', sub: 'expensas', paymentMethod: 'transferencia', recurrence: 'monthly' })
    add({ type: 'expense', amountCents: $(round(between(38_000, 52_000))), date: day(18), description: 'Edenor', cat: 'servicios', sub: 'luz', recurrence: 'monthly' })
    add({ type: 'expense', amountCents: $(round(between(22_000, 34_000))), date: day(20), description: 'Metrogas', cat: 'servicios', sub: 'gas', recurrence: 'monthly' })
    add({ type: 'expense', amountCents: $(monthsAgo <= 1 ? 32_900 : 29_900), date: day(12), description: 'Personal Flow internet', cat: 'servicios', sub: 'internet', paymentMethod: 'credito', recurrence: 'monthly' })
    add({ type: 'expense', amountCents: $(18_500), date: day(12), description: 'Personal celular', cat: 'servicios', sub: 'celular', paymentMethod: 'credito', recurrence: 'monthly' })
    add({ type: 'expense', amountCents: $(45_000), date: day(3), description: 'Megatlon gimnasio', cat: 'salud', paymentMethod: 'credito', recurrence: 'monthly' })

    // suscripciones (sin marcar como recurrentes: las detecta el motor)
    add({ type: 'expense', amountCents: $(monthsAgo <= 1 ? 14_999 : 12_999), date: day(8), description: 'Netflix.com', cat: 'suscripciones', paymentMethod: 'credito' })
    add({ type: 'expense', amountCents: $(4_599), date: day(15), description: 'Spotify', cat: 'suscripciones', paymentMethod: 'credito' })
    add({ type: 'expense', amountCents: $(9_899), date: day(22), description: 'Disney Plus', cat: 'suscripciones', paymentMethod: 'credito' })
    add({ type: 'expense', amountCents: $(7_499), date: day(25), description: 'Max streaming', cat: 'suscripciones', paymentMethod: 'credito' })
    add({ type: 'expense', amountCents: $(1_999), date: day(2), description: 'Apple iCloud', cat: 'suscripciones', paymentMethod: 'credito' })
    add({ type: 'expense', amountCents: $(26_400), date: day(14), description: 'ChatGPT Plus', cat: 'suscripciones', paymentMethod: 'credito' })

    // cuotas
    const phoneCuota = 3 + m
    if (phoneCuota <= 12) add({ type: 'expense', amountCents: $(85_000), date: day(10), description: `Samsung Galaxy cuota ${phoneCuota}/12`, cat: 'cuotas', paymentMethod: 'credito', recurrence: 'monthly' })
    const fridge = 2 + m
    if (fridge <= 9) add({ type: 'expense', amountCents: $(62_000), date: day(15), description: `Heladera Frávega cuota ${fridge}/9`, cat: 'cuotas', paymentMethod: 'credito', recurrence: 'monthly' })

    // supermercado
    const superTrips = 5 + Math.floor(r() * 3)
    for (let i = 0; i < superTrips; i++) {
      add({ type: 'expense', amountCents: $(round(between(24_000, 92_000))), date: day(1 + Math.floor(r() * dim)), description: pick(['Coto', 'Carrefour Market', 'Día %', 'Supermercado Chino', 'Jumbo']), cat: 'super', paymentMethod: pick(['debito', 'credito', 'billetera']) })
    }

    // delivery: crece en los últimos meses
    const deliveries = (isCurrent ? 10 : monthsAgo === 1 ? 8 : 6) + Math.floor(r() * 2)
    for (let i = 0; i < deliveries; i++) {
      add({ type: 'expense', amountCents: $(round(between(8_500, 16_500))), date: day(1 + Math.floor(r() * dim)), description: pick(['PedidosYa *Mostaza', 'PedidosYa *La Continental', 'Rappi *Sushi Pop', 'PedidosYa *Kentucky', 'Rappi *Farmacity']), cat: 'delivery', paymentMethod: 'billetera' })
    }

    // cafés y kiosco (microgastos)
    const coffees = 12 + Math.floor(r() * 5)
    for (let i = 0; i < coffees; i++) {
      add({ type: 'expense', amountCents: $(round(between(3_200, 4_800))), date: day(1 + Math.floor(r() * dim)), description: pick(['Café Martínez', 'Havanna', 'Starbucks', 'Café de especialidad']), cat: 'cafe', paymentMethod: 'billetera' })
    }
    for (let i = 0; i < 8; i++) {
      add({ type: 'expense', amountCents: $(round(between(1_500, 3_600))), date: day(1 + Math.floor(r() * dim)), description: 'Maxikiosco', cat: 'cafe', paymentMethod: 'efectivo' })
    }

    // apps de viaje
    for (let i = 0; i < 5; i++) {
      add({ type: 'expense', amountCents: $(round(between(4_200, 9_800))), date: day(1 + Math.floor(r() * dim)), description: pick(['Uber', 'Cabify', 'DiDi']), cat: 'transporte', sub: 'apps-viaje', paymentMethod: 'credito' })
    }
    add({ type: 'expense', amountCents: $(10_000), date: day(2), description: 'Carga SUBE', cat: 'transporte', sub: 'publico', paymentMethod: 'billetera' })
    add({ type: 'expense', amountCents: $(10_000), date: day(16), description: 'Carga SUBE', cat: 'transporte', sub: 'publico', paymentMethod: 'billetera' })
    for (let i = 0; i < 1 + Math.floor(r() * 2); i++) add({ type: 'expense', amountCents: $(round(between(28_000, 55_000))), date: day(1 + Math.floor(r() * dim)), description: pick(['YPF', 'Shell', 'Axion']), cat: 'transporte', sub: 'combustible', paymentMethod: 'credito' })

    // restaurantes: este mes bastante más
    const dinners = isCurrent ? 4 : 2 + Math.floor(r() * 2)
    for (let i = 0; i < dinners; i++) {
      const base = isCurrent ? between(38_000, 62_000) : between(26_000, 48_000)
      add({ type: 'expense', amountCents: $(round(base)), date: day(1 + Math.floor(r() * Math.min(dim, 26))), description: pick(['Don Julio', 'La Parolaccia', 'Café San Juan', 'El Preferido', 'Sarkis']), cat: 'resto', paymentMethod: 'credito' })
    }

    // compras chicas repetidas en mercado libre (impulsivas)
    for (let i = 0; i < 3; i++) {
      add({ type: 'expense', amountCents: $(round(between(2_900, 4_900))), date: day(1 + Math.floor(r() * dim)), description: 'Mercado Libre', cat: 'compras', paymentMethod: 'billetera', tags: ['online'] })
    }
    if (r() > 0.4) add({ type: 'expense', amountCents: $(round(between(45_000, 110_000), 1000)), date: day(1 + Math.floor(r() * dim)), description: pick(['Zara', 'Nike Store', 'Adidas']), cat: 'compras', paymentMethod: 'credito' })

    // ocio, salud, regalos
    add({ type: 'expense', amountCents: $(round(between(8_500, 12_000))), date: day(1 + Math.floor(r() * dim)), description: 'Cinemark', cat: 'ocio', paymentMethod: 'credito' })
    if (m % 3 === 0) add({ type: 'expense', amountCents: $(round(between(60_000, 85_000), 1000)), date: day(20), description: 'Entradas recital', cat: 'ocio', paymentMethod: 'credito' })
    add({ type: 'expense', amountCents: $(round(between(8_000, 26_000))), date: day(1 + Math.floor(r() * dim)), description: 'Farmacity', cat: 'salud', paymentMethod: 'debito' })
    if (m % 2 === 0) add({ type: 'expense', amountCents: $(round(between(25_000, 45_000), 1000)), date: day(1 + Math.floor(r() * dim)), description: 'Regalo cumpleaños', cat: 'regalos', paymentMethod: 'credito' })
  }

  // hace 5 semanas se sacó el vuelo del viaje (se cruza después con el mail de confirmación)
  add({ type: 'expense', amountCents: $(286_000), date: addDays(today, -35), description: 'Aerolíneas Argentinas vuelo BRC', cat: 'viajes', paymentMethod: 'credito', tags: ['bariloche'] })
  // movimiento fuera de lo normal este mes
  add({ type: 'expense', amountCents: $(139_000), date: addDays(today, -3), description: 'Auriculares Sony WH-1000', cat: 'compras', paymentMethod: 'credito' })

  const start = addMonths(startOfMonth(today), -5)
  return {
    initialBalanceCents: $(1_200_000),
    transactions: tx.sort((a, b) => a.date.localeCompare(b.date)),
    budgets: [
      { name: 'Gasto total del mes', cat: null, period: 'monthly', amountCents: $(2_350_000) },
      { name: 'Supermercado', cat: 'super', period: 'monthly', amountCents: $(430_000) },
      { name: 'Delivery', cat: 'delivery', period: 'monthly', amountCents: $(110_000) },
      { name: 'Restaurantes y bares', cat: 'resto', period: 'monthly', amountCents: $(170_000) },
      { name: 'Ocio', cat: 'ocio', period: 'monthly', amountCents: $(95_000) },
      { name: 'Viaje a Bariloche', cat: 'viajes', period: 'yearly', amountCents: $(1_200_000), goal: 'viaje' },
    ],
    goals: [
      { key: 'fondo', name: 'Fondo de emergencia', kind: 'emergency', targetCents: $(3_600_000), savedCents: $(1_450_000), startDate: start, targetDate: addMonths(today, 7) },
      { key: 'viaje', name: 'Viaje a Bariloche', kind: 'travel', targetCents: $(1_200_000), savedCents: $(820_000), startDate: addMonths(start, 1), targetDate: addDays(today, 8) },
      { key: 'notebook', name: 'Notebook nueva', kind: 'purchase', targetCents: $(1_500_000), savedCents: $(900_000), startDate: start, targetDate: addMonths(today, 5) },
      { key: 'inversion', name: 'Invertir en FCI', kind: 'investment', targetCents: $(2_000_000), savedCents: $(350_000), startDate: addMonths(start, 3), targetDate: addMonths(today, 12) },
    ],
  }
}
