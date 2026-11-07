import { features } from '../features'
import { day, formatDate, type Item } from '../data'

type Props = {
  items: Item[]
}

function Calendar({ items }: Props): React.JSX.Element {
  const days = Array.from({ length: 7 }, (_, i) => day(i))
  const upcoming = items
    .filter((i) => !i.done && i.date >= day(0))
    .sort((a, b) => a.date.localeCompare(b.date))
  const next = upcoming[0]
  const nextFeature = features.find((f) => f.id === next?.feature)

  return (
    <section className="flex gap-3 rounded-lg bg-[#2b2d31] p-3">
      <div className="w-56 shrink-0 rounded-md bg-[#1e1f22] p-3">
        <p className="mb-2 text-xs font-semibold text-zinc-400 uppercase">Next up</p>
        {next && nextFeature ? (
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${nextFeature.color}`}
            >
              <nextFeature.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{next.title}</p>
              <p className="text-sm text-zinc-400">{formatDate(next.date)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">All clear.</p>
        )}
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-7 gap-2">
        {days.map((d, i) => {
          const dayItems = upcoming.filter((item) => item.date === d)
          const date = new Date(`${d}T00:00`)
          return (
            <div
              key={d}
              className={`min-w-0 rounded-md bg-[#313338] p-2 ${i === 0 ? 'ring-1 ring-indigo-500' : ''}`}
            >
              <p className="text-xs text-zinc-400">
                {date.toLocaleDateString(undefined, { weekday: 'short' })}
                <span className="ml-1 font-semibold text-zinc-200">{date.getDate()}</span>
              </p>
              <div className="mt-1 space-y-0.5">
                {dayItems.slice(0, 3).map((item) => (
                  <p
                    key={item.id}
                    className="flex items-center gap-1.5 truncate text-xs text-zinc-300"
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${features.find((f) => f.id === item.feature)?.color}`}
                    />
                    <span className="truncate">{item.title}</span>
                  </p>
                ))}
                {dayItems.length > 3 && (
                  <p className="text-xs text-zinc-500">+{dayItems.length - 3} more</p>
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
