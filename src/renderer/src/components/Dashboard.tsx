import { LayoutDashboard } from 'lucide-react'
import { features } from '../features'
import { day, formatDate, type Item } from '../data'
import Calendar from './Calendar'

type Props = {
  items: Item[]
  enabled: string[]
  onOpen: (id: string) => void
}

function Dashboard({ items, enabled, onOpen }: Props): React.JSX.Element {
  return (
    <main className="flex min-w-0 flex-1 flex-col bg-[#313338]">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-black/20 px-4 font-semibold text-white">
        <LayoutDashboard size={18} className="text-zinc-400" />
        Dashboard
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Calendar items={items} />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {features
            .filter((f) => enabled.includes(f.id))
            .map((f) => {
              const own = items.filter((i) => i.feature === f.id)
              const open = own.filter((i) => !i.done)
              const next = open
                .filter((i) => i.date >= day(0))
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 3)
              return (
                <button
                  key={f.id}
                  onClick={() => onOpen(f.id)}
                  className="rounded-lg bg-[#2b2d31] p-4 text-left transition-colors hover:bg-[#35373c]"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${f.color}`}
                    >
                      <f.icon size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{f.name}</p>
                      <p className="text-xs text-zinc-400">
                        {open.length} open · {own.length - open.length} done
                      </p>
                    </div>
                  </div>
                  {next.length > 0 ? (
                    <ul className="space-y-1">
                      {next.map((i) => (
                        <li key={i.id} className="flex justify-between gap-2 text-sm">
                          <span className="truncate text-zinc-300">{i.title}</span>
                          <span className="shrink-0 text-zinc-500">{formatDate(i.date)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-zinc-500">Nothing coming up.</p>
                  )}
                </button>
              )
            })}
        </div>
      </div>
    </main>
  )
}

export default Dashboard
