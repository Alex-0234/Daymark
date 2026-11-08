import { useState } from 'react'
import Rail from './components/Rail'
import Page from './components/Page'
import Dashboard from './components/Dashboard'
import { coreFeatures, features } from './features'

function App(): React.JSX.Element {
  const [enabled, setEnabled] = useState(coreFeatures)
  const [active, setActive] = useState('dashboard')
  const feature = features.find((f) => f.id === active)

  const enable = (id: string): void => {
    setEnabled([...enabled, id])
    setActive(id)
  }

  return (
    <div className="flex h-screen w-full font-sans">
      <Rail enabled={enabled} active={active} onSelect={setActive} onAdd={enable} />
      {feature ? (
        <Page key={feature.id} feature={feature} />
      ) : (
        <Dashboard enabled={enabled} onOpen={setActive} />
      )}
    </div>
  )
}

export default App
