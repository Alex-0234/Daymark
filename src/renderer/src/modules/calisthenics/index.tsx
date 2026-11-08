import { useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { CaliProvider } from './CaliContext'
import { useCali } from './useCali'
import { Button, Elapsed } from './ui'
import Status from './Status'
import Train from './Train'
import Library from './Library'
import History from './History'
import Session from './Session'
import Summary from './Summary'
import type { Routine, Workout } from './utils'

const TABS = [
  { id: 'status', name: 'Status' },
  { id: 'train', name: 'Train' },
  { id: 'library', name: 'Exercises' },
  { id: 'history', name: 'History' }
] as const

type Tab = (typeof TABS)[number]['id']

function Shell(): React.JSX.Element {
  const { loaded, draft, startWorkout } = useCali()
  const [tab, setTab] = useState<Tab>('status')
  const [inSession, setInSession] = useState(false)
  const [summary, setSummary] = useState<Workout | null>(null)

  const start = (routine?: Routine): void => {
    if (!draft) startWorkout(routine)
    setInSession(true)
  }

  if (draft && inSession)
    return (
      <main className="flex min-w-0 flex-1 flex-col bg-bg">
        <Session
          onBack={() => setInSession(false)}
          onFinish={(workout) => {
            setInSession(false)
            setSummary(workout)
          }}
        />
      </main>
    )

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-bg">
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-line px-5">
        <div className="flex items-center gap-2.5">
          <Dumbbell size={16} className="text-orange-400 drop-shadow-[0_0_6px_currentColor]" />
          <h1 className="glow text-sm font-semibold text-fg">Calisthenics</h1>
        </div>
        <nav className="flex gap-0.5 rounded-lg bg-panel p-0.5 shadow-panel">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1 text-xs transition-colors ${
                tab === t.id ? 'bg-raised text-fg shadow-panel' : 'text-muted hover:text-fg'
              }`}
            >
              {t.name}
            </button>
          ))}
        </nav>
        <div className="ml-auto">
          {draft ? (
            <Button variant="outline" onClick={() => setInSession(true)}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span className="font-mono tabular-nums">
                <Elapsed since={draft.startedAt} />
              </span>
              Resume
            </Button>
          ) : (
            <Button variant="primary" onClick={() => start()}>
              Start workout
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-5">
          {!loaded ? (
            <p className="py-16 text-center text-sm text-subtle">Loading…</p>
          ) : tab === 'status' ? (
            <Status onStart={() => start()} />
          ) : tab === 'train' ? (
            <Train onStart={start} onResume={() => setInSession(true)} />
          ) : tab === 'library' ? (
            <Library />
          ) : (
            <History />
          )}
        </div>
      </div>

      {summary && <Summary workout={summary} onClose={() => setSummary(null)} />}
    </main>
  )
}

function Calisthenics(): React.JSX.Element {
  return (
    <CaliProvider>
      <Shell />
    </CaliProvider>
  )
}

export default Calisthenics
