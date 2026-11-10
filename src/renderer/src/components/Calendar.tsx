import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { features } from '../features'
import { day, formatDate, weekday, type List } from '../data'

type Props = {
  lists: List[]
}

const WEEKS_EXPANDED = 4
const COLLAPSED_ITEMS = 3

// Shared by every page's calendar, so the choice carries over between pages.
const readExpanded = (): boolean => {
  try {
    return localStorage.getItem('calendar.expanded') === '1'
  } catch {
    return false
  }
}

function Calendar({ lists }: Props): React.JSX.Element {
  const [expanded, setExpanded] = useState(readExpanded)
  const toggle = (): void => {
    setExpanded(!expanded)
    try {
      localStorage.setItem('calendar.expanded', expanded ? '0' : '1')
    } catch {
      // not persisted; the toggle still works for this session
    }
  }

  const days = Array.from({ length: expanded ? 7 * WEEKS_EXPANDED : 7 }, (_, i) => day(i))
  const limit = expanded ? Infinity : COLLAPSED_ITEMS
  const upcoming = lists
    .flatMap((l) => l.items.map((i) => ({ ...i, feature: l.feature })))
    .filter((i) => !i.done && i.date >= day(0))
    .sort((a, b) => a.date.localeCompare(b.date))
  const next = upcoming[0]
  const nextFeature = features.find((f) => f.id === next?.feature)

  return (
    <section className="flex gap-3 rounded-xl bg-panel p-3 shadow-panel">
      <div
        className={`flex w-60 shrink-0 flex-col justify-between rounded-lg bg-raised p-4 shadow-panel ${expanded ? 'self-start' : ''}`}
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium tracking-wider text-subtle uppercase">Next up</p>
          <button
            onClick={toggle}
            title={expanded ? 'Show one week' : `Show ${WEEKS_EXPANDED} weeks`}
            className="-my-1 flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-subtle hover:bg-bg hover:text-fg"
          >
            {expanded ? '1 week' : `${WEEKS_EXPANDED} weeks`}
            <ChevronDown
              size={14}
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
        {next && nextFeature ? (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-bg">
              <nextFeature.icon
                size={18}
                className={`${nextFeature.text} drop-shadow-[0_0_6px_currentColor]`}
              />
            </div>
            <div className="min-w-0">
              <p className="glow truncate text-sm font-semibold text-fg">{next.title}</p>
              <p className="text-xs text-muted">{formatDate(next.date)}</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">All clear.</p>
        )}
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-7 gap-2">
        {days.map((d, i) => {
          const dayItems = upcoming.filter(
            (item) => item.date === d || (item.date < d && item.repeat.includes(weekday(d)))
          )
          const date = new Date(`${d}T00:00`)
          return (
            <div
              key={d}
              className={`min-w-0 rounded-lg border p-2.5 ${
                i === 0 ? 'border-line-strong bg-raised shadow-panel' : 'border-line bg-bg'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span
                  className={`text-[11px] tracking-wider uppercase ${i === 0 ? 'text-fg' : 'text-subtle'}`}
                >
                  {i === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
                <span
                  className={`text-sm font-semibold tabular-nums ${i === 0 ? 'glow text-fg' : 'text-muted'}`}
                >
                  {expanded && (i === 0 || date.getDate() === 1) && (
                    <span className="mr-1 text-[11px] font-normal text-subtle">
                      {date.toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                  )}
                  {date.getDate()}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {dayItems.slice(0, limit).map((item) => (
                  <p key={item.id} className="flex items-center gap-1.5 text-xs text-muted">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full shadow-[0_0_6px_currentColor] ${features.find((f) => f.id === item.feature)?.color}`}
                    />
                    <span className="truncate">{item.title}</span>
                  </p>
                ))}
                {dayItems.length > limit && (
                  <button onClick={toggle} className="text-xs text-subtle hover:text-fg">
                    +{dayItems.length - limit} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default Calendar
