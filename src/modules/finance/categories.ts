import { and, asc, eq } from 'drizzle-orm'
import type { DB } from '@/db/client'
import { schema } from '@/db/client'
import { newId } from '@/lib/ids'

type Seed = {
  key: string
  name: string
  kind: 'expense' | 'income'
  icon: string
  group: string
  slot?: number
  subs?: { key: string; name: string; icon: string; group?: string }[]
}

// categorías por defecto. `group` es lo que usa el motor de análisis, así el usuario puede renombrar sin romper nada.
export const DEFAULT_CATEGORIES: Seed[] = [
  { key: 'super', name: 'Supermercado', kind: 'expense', icon: 'shopping-cart', group: 'groceries', slot: 2 },
  { key: 'delivery', name: 'Delivery', kind: 'expense', icon: 'bike', group: 'delivery', slot: 6 },
  { key: 'resto', name: 'Restaurantes y bares', kind: 'expense', icon: 'utensils', group: 'dining', slot: 5 },
  {
    key: 'transporte',
    name: 'Transporte',
    kind: 'expense',
    icon: 'car',
    group: 'transport',
    slot: 8,
    subs: [
      { key: 'apps-viaje', name: 'Apps de viaje', icon: 'car-taxi-front', group: 'rides' },
      { key: 'combustible', name: 'Combustible', icon: 'fuel' },
      { key: 'publico', name: 'Transporte público', icon: 'bus' },
    ],
  },
  {
    key: 'hogar',
    name: 'Hogar',
    kind: 'expense',
    icon: 'home',
    group: 'housing',
    slot: 1,
    subs: [
      { key: 'alquiler', name: 'Alquiler', icon: 'key-round' },
      { key: 'expensas', name: 'Expensas', icon: 'building' },
    ],
  },
  {
    key: 'servicios',
    name: 'Servicios',
    kind: 'expense',
    icon: 'zap',
    group: 'utilities',
    slot: 3,
    subs: [
      { key: 'luz', name: 'Luz', icon: 'lightbulb' },
      { key: 'gas', name: 'Gas', icon: 'flame' },
      { key: 'internet', name: 'Internet', icon: 'wifi' },
      { key: 'celular', name: 'Celular', icon: 'smartphone' },
    ],
  },
  { key: 'suscripciones', name: 'Suscripciones', kind: 'expense', icon: 'repeat', group: 'subscriptions' },
  { key: 'ocio', name: 'Ocio', kind: 'expense', icon: 'ticket', group: 'leisure' },
  { key: 'cafe', name: 'Café y snacks', kind: 'expense', icon: 'coffee', group: 'coffee' },
  { key: 'compras', name: 'Compras', kind: 'expense', icon: 'shopping-bag', group: 'shopping', slot: 4 },
  { key: 'salud', name: 'Salud', kind: 'expense', icon: 'heart-pulse', group: 'health' },
  { key: 'educacion', name: 'Educación', kind: 'expense', icon: 'graduation-cap', group: 'education' },
  { key: 'regalos', name: 'Regalos', kind: 'expense', icon: 'gift', group: 'gifts' },
  { key: 'viajes', name: 'Viajes', kind: 'expense', icon: 'plane', group: 'travel' },
  { key: 'cuotas', name: 'Cuotas y préstamos', kind: 'expense', icon: 'credit-card', group: 'installments', slot: 7 },
  { key: 'otros', name: 'Otros gastos', kind: 'expense', icon: 'circle-dashed', group: 'other' },
  { key: 'sueldo', name: 'Sueldo', kind: 'income', icon: 'briefcase', group: 'salary' },
  { key: 'freelance', name: 'Trabajos extra', kind: 'income', icon: 'laptop', group: 'freelance' },
  { key: 'rendimientos', name: 'Rendimientos', kind: 'income', icon: 'trending-up', group: 'investment_income' },
  { key: 'otros-ingresos', name: 'Otros ingresos', kind: 'income', icon: 'plus', group: 'other_income' },
]

/** crea las categorías por defecto y devuelve un mapa key → id (útil para el seed demo) */
export async function seedCategories(db: DB, userId: string): Promise<Record<string, string>> {
  const ids: Record<string, string> = {}
  const rows: (typeof schema.categories.$inferInsert)[] = []
  DEFAULT_CATEGORIES.forEach((c, i) => {
    const id = newId()
    ids[c.key] = id
    rows.push({ id, userId, name: c.name, kind: c.kind, icon: c.icon, group: c.group, colorSlot: c.slot ?? null, sortOrder: i })
    c.subs?.forEach((s, j) => {
      const sid = newId()
      ids[s.key] = sid
      rows.push({ id: sid, userId, parentId: id, name: s.name, kind: c.kind, icon: s.icon, group: s.group ?? c.group, colorSlot: null, sortOrder: j })
    })
  })
  await db.insert(schema.categories).values(rows)
  return ids
}

export async function listCategories(db: DB, userId: string) {
  return db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.userId, userId))
    .orderBy(asc(schema.categories.sortOrder))
}

export async function getCategory(db: DB, userId: string, id: string) {
  const rows = await db
    .select()
    .from(schema.categories)
    .where(and(eq(schema.categories.userId, userId), eq(schema.categories.id, id)))
    .limit(1)
  return rows[0] ?? null
}
