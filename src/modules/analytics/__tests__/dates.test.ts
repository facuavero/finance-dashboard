import { describe, expect, it } from 'vitest'
import { addMonths, periodRange, previousComparableRange, startOfWeek } from '../dates'

describe('dates', () => {
  it('addMonths respeta el fin de mes', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-03-15', -3)).toBe('2025-12-15')
  })
  it('semana empieza el lunes', () => {
    expect(startOfWeek('2026-09-27')).toBe('2026-09-21') // domingo → lunes anterior
    expect(startOfWeek('2026-09-21')).toBe('2026-09-21')
  })
  it('rangos de trimestre y año', () => {
    expect(periodRange('quarter', '2026-08-10')).toEqual({ start: '2026-07-01', end: '2026-09-30' })
    expect(periodRange('year', '2026-08-10')).toEqual({ start: '2026-01-01', end: '2026-12-31' })
  })
  it('comparable: mismo tramo del mes anterior', () => {
    const r = periodRange('month', '2026-09-14')
    expect(previousComparableRange('month', r, '2026-09-14')).toEqual({ start: '2026-08-01', end: '2026-08-14' })
  })
})
