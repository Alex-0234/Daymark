import { Plus } from 'lucide-react'
import type { Feature } from '../features'
import { useList } from '../context/useList'
import Calendar from './Calendar'
import Rows from './Rows'

type Props = {
  feature: Feature
}

function Page({ feature }: Props): React.JSX.Element | null {
  const { lists, addItem } = useList()
  const list = lists.find((l) => l.feature === feature.id)
  if (!list) return null

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-bg">
      <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-line px-5">
        <feature.icon size={16} className={feature.text} />
        <h1 className="glow text-sm font-semibold text-fg">{list.name}</h1>
        <span className="text-xs text-subtle tabular-nums">{list.items.length}</span>
        <button
          onClick={() => addItem(list.id)}
          className="ml-auto flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-fg shadow-panel transition-opacity hover:opacity-90"
        >
          <Plus size={14} />
          New
        </button>
      </header>
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <Calendar lists={[list]} />
        <Rows list={list} />
      </div>
    </main>
  )
}

export default Page
