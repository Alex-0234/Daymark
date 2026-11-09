import { useEffect, useState } from 'react'
import { Ruler, Trash2 } from 'lucide-react'
import { Button, Card, Label } from '../calisthenics/ui'
import { day, formatDate } from '../../data'
import { METRICS, type MetricEntry, type MetricKey } from '../../../../shared/metrics'

const api = window.api.metrics

type Draft = Record<MetricKey, string>

const toDraft = (entry?: MetricEntry): Draft =>
  Object.fromEntries(METRICS.map((m) => [m.key, entry?.values[m.key]?.toString() ?? ''])) as Draft

const fmt = (n: number): string => (Math.round(n * 10) / 10).toString()

const input =
  'h-9 w-full rounded-lg border border-line-strong bg-bg px-2.5 text-sm text-fg tabular-nums outline-none select-text placeholder:text-subtle focus:border-muted'

function Metrics(): React.JSX.Element {
  const [entries, setEntries] = useState<MetricEntry[]>([])
  const [loaded, setLoaded] = useState(false)
  const [date, setDate] = useState(day())
  const [draft, setDraft] = useState<Draft>(toDraft())

  useEffect(() => {
    api.entries().then((data) => {
      setEntries(data)
      setDraft(toDraft(data.find((e) => e.date === day())))
      setLoaded(true)
    })
  }, [])

  const existing = entries.find((e) => e.date === date)

  const pickDate = (next: string): void => {
    setDate(next)
    setDraft(toDraft(entries.find((e) => e.date === next)))
  }

  const save = (): void => {
    const values: MetricEntry['values'] = {}
    for (const m of METRICS) {
      const n = Number(draft[m.key])
      if (draft[m.key].trim() && n > 0) values[m.key] = n
    }
    if (Object.keys(values).length === 0) return
    const entry = { date, values }
    api.save(entry)
    setEntries((prev) =>
      [...prev.filter((e) => e.date !== date), entry].sort((a, b) => b.date.localeCompare(a.date))
    )
  }

  const remove = (target: string): void => {
    api.remove(target)
    setEntries((prev) => prev.filter((e) => e.date !== target))
    if (target === date) setDraft(toDraft())
  }

  // Latest value of each metric, and the change since the measurement before it.
  const latest = METRICS.flatMap((m) => {
    const taken = entries.filter((e) => e.values[m.key] !== undefined)
    if (taken.length === 0) return []
    const now = taken[0].values[m.key]!
    const before = taken[1]?.values[m.key]
    return [
      { ...m, value: now, date: taken[0].date, change: before === undefined ? null : now - before }
    ]
  })
  const columns = METRICS.filter((m) => entries.some((e) => e.values[m.key] !== undefined))

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-bg">
      <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-line px-5">
        <Ruler size={16} className="text-emerald-400 drop-shadow-[0_0_6px_currentColor]" />
        <h1 className="glow text-sm font-semibold text-fg">Body metrics</h1>
        <span className="text-xs text-subtle tabular-nums">{entries.length}</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-5 p-5">
          {!loaded ? (
            <p className="py-16 text-center text-sm text-subtle">Loading…</p>
          ) : (
            <>
              {latest.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                  {latest.map((m) => (
                    <Card key={m.key} className="p-4">
                      <Label>{m.label}</Label>
                      <p className="mt-1 font-mono text-xl font-semibold text-fg tabular-nums">
                        {fmt(m.value)}
                        <span className="ml-1 text-xs font-normal text-subtle">{m.unit}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-subtle tabular-nums">
                        {m.change !== null && m.change !== 0 && (
                          <span className="text-muted">
                            {m.change > 0 ? '+' : ''}
                            {fmt(m.change)} ·{' '}
                          </span>
                        )}
                        {formatDate(m.date)}
                      </p>
                    </Card>
                  ))}
                </div>
              )}

              <Card className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Label>{existing ? 'Update entry' : 'Log measurements'}</Label>
                  <input
                    type="date"
                    value={date}
                    max={day()}
                    onChange={(e) => e.target.value && pickDate(e.target.value)}
                    className={input.replace('w-full', 'w-40')}
                  />
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    save()
                  }}
                  className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] items-end gap-3"
                >
                  {METRICS.map((m) => (
                    <label key={m.key} className="space-y-1">
                      <span className="text-xs text-muted">
                        {m.label} <span className="text-subtle">({m.unit})</span>
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={m.step}
                        placeholder="—"
                        value={draft[m.key]}
                        onChange={(e) => setDraft({ ...draft, [m.key]: e.target.value })}
                        className={input}
                      />
                    </label>
                  ))}
                  <Button type="submit" variant="primary" className="h-9">
                    {existing ? 'Update' : 'Save'}
                  </Button>
                </form>
              </Card>

              <Card className="overflow-x-auto">
                {entries.length === 0 ? (
                  <p className="py-12 text-center text-sm text-subtle">
                    Nothing logged yet. Start with your weight.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line-strong text-left text-[11px] tracking-wider text-subtle uppercase">
                        <th className="px-4 py-2.5 font-medium">Date</th>
                        {columns.map((m) => (
                          <th key={m.key} className="px-4 py-2.5 text-right font-medium">
                            {m.label} ({m.unit})
                          </th>
                        ))}
                        <th className="w-11" />
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e) => (
                        <tr
                          key={e.date}
                          onClick={() => pickDate(e.date)}
                          className={`cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-raised ${e.date === date ? 'bg-raised' : ''}`}
                        >
                          <td className="px-4 py-2.5 text-fg">{formatDate(e.date)}</td>
                          {columns.map((m) => (
                            <td
                              key={m.key}
                              className="px-4 py-2.5 text-right text-muted tabular-nums"
                            >
                              {e.values[m.key] !== undefined ? fmt(e.values[m.key]!) : '—'}
                            </td>
                          ))}
                          <td className="px-2">
                            <button
                              title="Delete entry"
                              onClick={(ev) => {
                                ev.stopPropagation()
                                remove(e.date)
                              }}
                              className="rounded-md p-1.5 text-subtle hover:bg-danger/10 hover:text-danger"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default Metrics
