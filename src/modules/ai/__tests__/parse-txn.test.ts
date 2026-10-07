import { describe, expect, it } from 'vitest'
import { ruleParseTxn, ruleRefine, type ParseCat } from '../parse-txn'

const cats: ParseCat[] = [
  { id: 'delivery', name: 'Delivery', kind: 'expense', parentId: null },
  { id: 'super', name: 'Supermercado', kind: 'expense', parentId: null },
  { id: 'transp', name: 'Transporte', kind: 'expense', parentId: null },
  { id: 'apps', name: 'Apps de viaje', kind: 'expense', parentId: 'transp' },
  { id: 'subs', name: 'Suscripciones', kind: 'expense', parentId: null },
  { id: 'sueldo', name: 'Sueldo', kind: 'income', parentId: null },
]
const TODAY = '2026-10-07' // miércoles

describe('ruleParseTxn', () => {
  it('monto, categoría y fecha', () => {
    const { draft } = ruleParseTxn('pedidosya 4.500 ayer', cats, TODAY)
    expect(draft).toMatchObject({ type: 'expense', amountCents: 450_000, date: '2026-10-06', categoryId: 'delivery', description: 'Pedidosya' })
  })
  it('subcategoría pone la categoría padre', () => {
    const { draft } = ruleParseTxn('uber 9700', cats, TODAY)
    expect(draft).toMatchObject({ categoryId: 'transp', subcategoryId: 'apps', amountCents: 970_000, date: TODAY })
  })
  it('jerga de plata', () => {
    expect(ruleParseTxn('coto 25k', cats, TODAY).draft.amountCents).toBe(2_500_000)
    expect(ruleParseTxn('cena 2 lucas', cats, TODAY).draft.amountCents).toBe(200_000)
    expect(ruleParseTxn('compra 1,5 palos', cats, TODAY).draft.amountCents).toBe(150_000_000)
  })
  it('ingreso', () => {
    const { draft } = ruleParseTxn('cobré el sueldo 1.200.000', cats, TODAY)
    expect(draft).toMatchObject({ type: 'income', amountCents: 120_000_000, categoryId: 'sueldo' })
  })
  it('la fecha no se confunde con el monto', () => {
    const { draft } = ruleParseTxn('netflix 8999 el 03/10', cats, TODAY)
    expect(draft).toMatchObject({ amountCents: 899_900, date: '2026-10-03', categoryId: 'subs' })
  })
  it('día de la semana y medio de pago', () => {
    const { draft } = ruleParseTxn('super 12000 el lunes con tarjeta', cats, TODAY)
    expect(draft).toMatchObject({ date: '2026-10-05', paymentMethod: 'credito', categoryId: 'super' })
  })
  it('sin monto queda nulo, sin inventar', () => {
    expect(ruleParseTxn('uber ayer', cats, TODAY).draft.amountCents).toBeNull()
  })
  it('rechaza montos fuera de rango', () => {
    expect(ruleParseTxn('compra 99999999999999999999', cats, TODAY).draft.amountCents).toBeNull()
  })
})

describe('ruleRefine', () => {
  it('cambia solo lo que se dice', () => {
    const prev = ruleParseTxn('pedidosya 4500', cats, TODAY).draft
    const next = ruleRefine(prev, 'era ayer', cats, TODAY)
    expect(next).toMatchObject({ date: '2026-10-06', amountCents: 450_000, categoryId: 'delivery' })
    expect(ruleRefine(prev, 'poné 5000', cats, TODAY).amountCents).toBe(500_000)
  })
})
