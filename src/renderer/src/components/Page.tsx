import { Plus } from 'lucide-react'
import type { Feature } from '../features'
import type { Item } from '../data'
import Calendar from './Calendar'
import Rows from './Rows'

type Props = {
  feature: Feature
  items: Item[]
  onAdd: () => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

function Page({ feature, items, onAdd, onToggle, onRemove }: Props): React.JSX.Element {
  return (
    <main className="flex min-w-0 flex-1 flex-col bg-[#313338]">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-black/20 px-4 font-semibold text-white">
        <feature.icon size={18} className="text-zinc-400" />
        {feature.name}
        <button
          onClick={onAdd}
          className="ml-auto flex items-center gap-1.5 rounded px-2 py-1 text-sm font-normal text-zinc-300 hover:bg-white/10 hover:text-white"
        >
          <Plus size={16} />
          New
        </button>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Calendar items={items} />
        <Rows feature={feature} items={items} onToggle={onToggle} onRemove={onRemove} />
      </div>
    </main>
  )
}

export default Page
