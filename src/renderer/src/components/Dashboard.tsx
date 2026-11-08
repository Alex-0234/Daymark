import { LayoutDashboard } from 'lucide-react'
import { features } from '../features'
import { day, formatDate } from '../data'
import { useList } from '../context/useList'
import Calendar from './Calendar'

type Props = {
  enabled: string[]
  onOpen: (id: string) => void
}

function Dashboard({ enabled, onOpen }: Props): React.JSX.Element {
  const lists = useList().lists.filter((l) => enabled.includes(l.feature))

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-bg">
      <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-line px-5">
        <LayoutDashboard size={16} className="text-muted" />
        <h1 className="glow text-sm font-semibold text-fg">Dashboard</h1>
      </header>
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <Calendar lists={lists} />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {features
            .filter((f) => enabled.includes(f.id))
            .map((f) => {
              const own = lists.filter((l) => l.feature === f.id).flatMap((l) => l.items)
              const open = own.filter((i) => !i.done)
              const next = open
                .filter((i) => i.date >= day(0))
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 3)
              return (
                <button
                  key={f.id}
                  onClick={() => onOpen(f.id)}
                  className="group rounded-xl bg-panel p-4 text-left shadow-panel transition-colors hover:bg-raised"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line-strong bg-bg">
                      <f.icon
                        size={16}
                        className={`${f.text} drop-shadow-[0_0_6px_currentColor]`}
                      />
                    </div>
                    <p className="text-sm font-medium text-fg">{f.name}</p>
                    <div className="ml-auto text-right">
                      <p className="glow text-xl leading-none font-semibold text-fg tabular-nums">
                        {open.length}
                      </p>
                      <p className="mt-1 text-[11px] text-subtle">
                        open · {own.length - open.length} done
                      </p>
                    </div>
                  </div>
                  {next.length > 0 ? (
                    <ul className="space-y-1.5 border-t border-line pt-3">
                      {next.map((i) => (
                        <li key={i.id} className="flex justify-between gap-2 text-xs">
                          <span className="truncate text-muted group-hover:text-fg">{i.title}</span>
                          <span className="shrink-0 text-subtle">{formatDate(i.date)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="border-t border-line pt-3 text-xs text-subtle">
                      Nothing coming up.
                    </p>
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
