'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, FileUp } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/input'
import { Switch } from '@/components/ui/misc'
import { money, parseMoneyInput } from '@/lib/format'
import { keywordGroup } from '@/modules/analytics/merchant'
import { importTransactionsAction } from '@/modules/finance/actions'
import type { CatLite } from './transactions-view'

function detectDelimiter(line: string) {
  const counts = [';', ',', '\t'].map((d) => [d, line.split(d).length] as const)
  return counts.sort((a, b) => b[1] - a[1])[0][0]
}

/** parser csv mínimo con comillas */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '')
  const delim = detectDelimiter(clean.split(/\r?\n/)[0] ?? '')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === delim) {
      row.push(cell.trim())
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++
      row.push(cell.trim())
      if (row.some((c) => c)) rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  row.push(cell.trim())
  if (row.some((c) => c)) rows.push(row)
  return rows
}

export function parseDate(raw: string): string | null {
  const s = raw.trim()
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/)
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3]
    const d = Number(m[1])
    const mo = Number(m[2])
    if (d > 31 || mo > 12) return null
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  return null
}

const GROUP_ROOT: Record<string, string> = { rides: 'transport', gym: 'health' }

export function ImportDialog({ open, onOpenChange, categories }: { open: boolean; onOpenChange: (v: boolean) => void; categories: CatLite[] }) {
  const router = useRouter()
  const [rows, setRows] = useState<string[][] | null>(null)
  const [fileName, setFileName] = useState('')
  const [map, setMap] = useState({ date: 0, description: 1, amount: 2 })
  const [invert, setInvert] = useState(false)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()

  const header = rows?.[0] ?? []
  const body = useMemo(() => rows?.slice(1) ?? [], [rows])

  const parsed = useMemo(
    () =>
      body.map((r) => {
        const date = parseDate(r[map.date] ?? '')
        let cents = parseMoneyInput(r[map.amount] ?? '')
        if (cents !== null && invert) cents = -cents
        const description = (r[map.description] ?? '').slice(0, 140)
        const group = keywordGroup(description)
        const root = group ? categories.find((c) => !c.parentId && c.group === (GROUP_ROOT[group] ?? group) && c.kind === ((cents ?? 0) < 0 ? 'expense' : 'income')) : null
        return { date, description, amountCents: cents, categoryId: root?.id ?? null, categoryName: root?.name ?? null, ok: !!date && cents !== null && cents !== 0 }
      }),
    [body, map, invert, categories],
  )
  const valid = parsed.filter((p) => p.ok)

  const onFile = async (file: File) => {
    setError('')
    if (file.size > 5 * 1024 * 1024) return setError('El archivo supera 5 MB.')
    const text = await file.text()
    const data = parseCsv(text)
    if (data.length < 2) return setError('No encontramos filas. ¿Es un CSV con encabezados?')
    setRows(data)
    setFileName(file.name)
    // mapeo propuesto: buscamos columnas por nombre (el usuario confirma)
    const h = data[0].map((c) => c.toLowerCase())
    const find = (words: string[], fallback: number) => {
      const i = h.findIndex((c) => words.some((w) => c.includes(w)))
      return i >= 0 ? i : fallback
    }
    setMap({ date: find(['fecha', 'date'], 0), description: find(['descrip', 'concepto', 'detalle', 'description', 'comercio'], 1), amount: find(['monto', 'importe', 'amount', 'valor'], 2) })
  }

  const reset = () => {
    setRows(null)
    setFileName('')
    setError('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent title="Importar movimientos" description="CSV exportado de tu banco o billetera. Revisás antes de confirmar." wide>
        {!rows ? (
          <div>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong px-6 py-10 text-center hover:bg-surface-2">
              <FileUp className="size-6 text-muted" aria-hidden />
              <span className="text-sm font-medium">Elegí un archivo CSV</span>
              <span className="text-[12px] text-muted">Necesita columnas de fecha, descripción y monto. Hasta 5 MB.</span>
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            </label>
            {error && (
              <p className="mt-3 text-[13px] text-critical" role="alert">
                {error}
              </p>
            )}
            <p className="mt-4 text-[12px] text-muted">Los montos negativos se cargan como gastos y los positivos como ingresos. Si tu banco exporta los gastos en positivo, lo invertís en el paso siguiente.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[13px] text-fg-2">
              <span className="font-medium">{fileName}</span> · {body.length} filas. Mapeamos cada columna con lo que creemos correcto, pero revisalo.
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {(['date', 'description', 'amount'] as const).map((k) => (
                <label key={k} className="flex flex-col gap-1 text-[13px]">
                  <span className="font-medium">{k === 'date' ? 'Fecha' : k === 'description' ? 'Descripción' : 'Monto'}</span>
                  <NativeSelect value={map[k]} onChange={(e) => setMap((m) => ({ ...m, [k]: Number(e.target.value) }))}>
                    {header.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Columna ${i + 1}`}
                      </option>
                    ))}
                  </NativeSelect>
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[13px]">
              <Switch checked={invert} onCheckedChange={setInvert} aria-label="Invertir signo" /> Mis gastos vienen en positivo (invertir signo)
            </label>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-[12px]">
                <thead className="bg-surface-2 text-left text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 font-medium">Descripción</th>
                    <th className="px-3 py-2 font-medium">Categoría sugerida</th>
                    <th className="px-3 py-2 text-right font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 6).map((p, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2">{p.date ?? <span className="text-critical">inválida</span>}</td>
                      <td className="max-w-48 truncate px-3 py-2">{p.description}</td>
                      <td className="px-3 py-2 text-muted">{p.categoryName ?? 'Sin categoría'}</td>
                      <td className="num px-3 py-2 text-right">{p.amountCents !== null ? money(p.amountCents, { sign: true }) : <span className="text-critical">inválido</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[12px] text-muted">
              {valid.length} de {parsed.length} filas se pueden importar{parsed.length - valid.length ? `. ${parsed.length - valid.length} se omiten por fecha o monto inválido` : ''}. Se etiquetan como #importado.
            </p>
            <div className="flex justify-between gap-2 border-t border-border pt-4">
              <Button variant="ghost" onClick={reset}>
                Elegir otro archivo
              </Button>
              <Button
                disabled={!valid.length}
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const res = await importTransactionsAction(valid.map((v) => ({ date: v.date!, description: v.description, amountCents: v.amountCents!, categoryId: v.categoryId })))
                    if (!res.ok) return void toast.error(res.error)
                    toast.success(`Importamos ${res.data?.count} movimientos`)
                    onOpenChange(false)
                    reset()
                    router.refresh()
                  })
                }
              >
                Importar {valid.length} <ArrowRight />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
