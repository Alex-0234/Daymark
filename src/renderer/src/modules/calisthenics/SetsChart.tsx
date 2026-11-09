import { useState } from 'react'
import { useCali } from './useCali'
import { Card, Label } from './ui'
import { setsPerGroup, weekStart } from '../../utils/charts'
import { day } from '../../data'
import { addDays } from '../../../../shared/date'

const WEEKS = 6
const PLOT_HEIGHT = 140

// Rounds up to 1 / 2 / 5 × 10ⁿ so the axis ticks stay clean.
const niceMax = (n: number): number => {
  if (n <= 4) return 4
  const p = Math.pow(10, Math.floor(Math.log10(n)))
  return ([1, 2, 5, 10].find((m) => m * p >= n) ?? 10) * p
}

const weekLabel = (start: string, i: number): string =>
  i === WEEKS - 1
    ? 'This week'
    : new Date(`${start}T00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

// Stacked weekly sets per movement group. Colors come from --series-1..4 (main.css),
// stepped per theme. Light-theme aqua/yellow sit under 3:1, so totals are labelled
// on every column and the table view is one click away.
function SetsChart(): React.JSX.Element {
  const { workouts, byId } = useCali()
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [hover, setHover] = useState<number | null>(null)

  const series = setsPerGroup(workouts, byId, { weeks: WEEKS })
  const current = weekStart(day())
  const weeks = Array.from({ length: WEEKS }, (_, i) => {
    const start = addDays(current, (i - (WEEKS - 1)) * 7)
    const values = series.map((s) => s.data[i])
    return { start, label: weekLabel(start, i), values, total: values.reduce((a, b) => a + b, 0) }
  })
  const max = niceMax(Math.max(...weeks.map((w) => w.total)))
  const empty = weeks.every((w) => w.total === 0)

  return (
    <Card className="p-4 2xl:col-span-2">
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Label>Sets per week</Label>
        <ul className="flex flex-wrap gap-3">
          {series.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5 text-xs text-muted">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
        <div className="ml-auto flex gap-0.5 rounded-lg bg-bg p-0.5">
          {(['chart', 'table'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-2.5 py-1 text-[11px] capitalize transition-colors ${
                view === v ? 'bg-raised text-fg shadow-panel' : 'text-muted hover:text-fg'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {empty ? (
        <p className="py-10 text-center text-xs text-subtle">
          No sets logged in the last {WEEKS} weeks.
        </p>
      ) : view === 'table' ? (
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="border-b border-line-strong text-left text-subtle">
              <th className="py-2 font-medium">Week</th>
              {series.map((s) => (
                <th key={s.id} className="py-2 text-right font-medium">
                  {s.label}
                </th>
              ))}
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.start} className="border-b border-line last:border-0">
                <td className="py-2 text-fg">{w.label}</td>
                {w.values.map((v, i) => (
                  <td key={series[i].id} className="py-2 text-right text-muted">
                    {v}
                  </td>
                ))}
                <td className="py-2 text-right font-semibold text-fg">{w.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="flex gap-2">
          {/* y-axis: three clean ticks */}
          <div
            className="relative w-6 shrink-0 text-right text-[10px] text-subtle tabular-nums"
            style={{ height: PLOT_HEIGHT }}
          >
            {[max, max / 2, 0].map((t, i) => (
              <span
                key={t}
                className="absolute right-0 -translate-y-1/2"
                style={{ top: `${i * 50}%` }}
              >
                {t}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative" style={{ height: PLOT_HEIGHT }}>
              {[0, 50].map((top) => (
                <div
                  key={top}
                  className="absolute inset-x-0 border-t border-dashed border-line"
                  style={{ top: `${top}%` }}
                />
              ))}
              <div className="absolute inset-x-0 bottom-0 border-t border-line-strong" />

              <div className="absolute inset-0 flex">
                {weeks.map((w, i) => (
                  <div
                    key={w.start}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    className={`relative flex flex-1 flex-col items-center justify-end rounded-md transition-colors ${
                      hover === i ? 'bg-raised/60' : ''
                    }`}
                  >
                    {w.total > 0 && (
                      <span className="mb-1 text-[10px] font-semibold text-fg tabular-nums">
                        {w.total}
                      </span>
                    )}
                    {/* Bottom-up stack sized to the total, so the 2px surface gaps come out of
                        the segments instead of making the column taller than the axis says. */}
                    <div
                      className="flex w-full max-w-7 flex-col-reverse gap-[2px] overflow-hidden rounded-t"
                      style={{ height: (w.total / max) * PLOT_HEIGHT }}
                    >
                      {w.values.map((v, s) =>
                        v > 0 ? (
                          <div
                            key={series[s].id}
                            className="min-h-px"
                            style={{ flex: `${v} 1 0`, background: series[s].color }}
                          />
                        ) : null
                      )}
                    </div>

                    {hover === i && (
                      <div
                        className={`pointer-events-none absolute top-0 z-10 w-36 rounded-lg bg-panel p-2.5 text-xs shadow-pop ${
                          i < WEEKS / 2 ? 'left-full ml-1' : 'right-full mr-1'
                        }`}
                      >
                        <p className="mb-1.5 font-medium text-fg">{w.label}</p>
                        {series.map((s, si) => (
                          <p key={s.id} className="flex items-center gap-1.5 text-muted">
                            <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                            {s.label}
                            <span className="ml-auto text-fg tabular-nums">{w.values[si]}</span>
                          </p>
                        ))}
                        <p className="mt-1.5 flex border-t border-line pt-1.5 text-muted">
                          Total <span className="ml-auto font-semibold text-fg">{w.total}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-1.5 flex">
              {weeks.map((w) => (
                <span key={w.start} className="flex-1 truncate text-center text-[10px] text-subtle">
                  {w.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default SetsChart
