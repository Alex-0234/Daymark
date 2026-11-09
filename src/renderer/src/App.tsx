import { Suspense, lazy, useEffect, useState } from 'react'
import Rail from './components/Rail'
import Page from './components/Page'
import Dashboard from './components/Dashboard'
import { coreFeatures, features } from './features'
import { useList } from './context/useList'

const modules: Record<string, React.LazyExoticComponent<() => React.JSX.Element>> = {
  workout: lazy(() => import('./modules/calisthenics')),
  metrics: lazy(() => import('./modules/metrics'))
}

function App(): React.JSX.Element {
  const [enabled, setEnabled] = useState(coreFeatures)
  const [active, setActive] = useState('dashboard')
  const { reload } = useList()
  const feature = features.find((f) => f.id === active)
  const Module = modules[active]

  useEffect(() => {
    window.api.modules.enabled().then(setEnabled)
  }, [])

  const enable = async (id: string): Promise<void> => {
    await window.api.modules.enable(id)
    await reload() // modules can add their own list items (e.g. the calisthenics hobby)
    setEnabled((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setActive(id)
  }

  const loading = (
    <main className="flex flex-1 items-center justify-center bg-bg text-sm text-subtle">
      Loading…
    </main>
  )

  return (
    <div className="flex h-screen w-full font-sans">
      <Rail enabled={enabled} active={active} onSelect={setActive} onAdd={enable} />
      {Module ? (
        <Suspense fallback={loading}>
          <Module />
        </Suspense>
      ) : feature ? (
        <Page key={feature.id} feature={feature} />
      ) : (
        <Dashboard enabled={enabled} onOpen={setActive} />
      )}
    </div>
  )
}

export default App
