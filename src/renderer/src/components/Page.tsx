import type { Feature } from '../features'
import { useList } from '../context/useList'
import Calendar from './Calendar'
import Rows from './Rows'

type Props = {
  feature: Feature
}

function Page({ feature }: Props): React.JSX.Element {
  const { lists, loaded } = useList()
  const list = lists.find((l) => l.feature === feature.id)

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-bg">
      <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-line px-5">
        <feature.icon size={16} className={feature.text} />
        <h1 className="glow text-sm font-semibold text-fg">{list?.name ?? feature.name}</h1>
        {list && <span className="text-xs text-subtle tabular-nums">{list.items.length}</span>}
      </header>
      {list ? (
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <Calendar lists={[list]} />
          <Rows list={list} />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-subtle">
          {loaded ? `${feature.name} isn't set up yet.` : 'Loading…'}
        </div>
      )}
    </main>
  )
}

export default Page
