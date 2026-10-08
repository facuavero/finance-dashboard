import { describe, expect, it } from 'vitest'
import { rulePlan } from '../assistant'
import type { ParseCat } from '../parse-txn'

const cats: ParseCat[] = [
  { id: 'delivery', name: 'Delivery', kind: 'expense', parentId: null },
  { id: 'super', name: 'Supermercado', kind: 'expense', parentId: null },
]
const TODAY = '2026-10-07'

describe('rulePlan', () => {
  it('separa movimientos, presupuestos y objetivos por línea', () => {
    const p = rulePlan('pedidosya 4500 ayer\npresupuesto de delivery 50000 por mes\nobjetivo viaje 1.500.000 para diciembre', cats, TODAY)
    expect(p.transactions).toHaveLength(1)
    expect(p.transactions[0]).toMatchObject({ amountCents: 450_000, categoryId: 'delivery', date: '2026-10-06' })
    expect(p.budgets).toEqual([{ name: 'Delivery', categoryId: 'delivery', period: 'monthly', amountCents: 5_000_000 }])
    expect(p.goals[0]).toMatchObject({ kind: 'travel', targetCents: 150_000_000, targetDate: '2026-12-31' })
  })
  it('un objetivo sin monto no se inventa', () => {
    expect(rulePlan('objetivo viaje a Brasil', cats, TODAY).goals).toHaveLength(0)
  })
})
