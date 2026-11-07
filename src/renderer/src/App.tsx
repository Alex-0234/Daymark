import { useState } from 'react'
import Rail from './components/Rail'
import Page from './components/Page'
import Dashboard from './components/Dashboard'
import { coreFeatures, features } from './features'
import { day, sampleItems } from './data'

function App(): React.JSX.Element {
  const [enabled, setEnabled] = useState(coreFeatures)
  const [active, setActive] = useState('dashboard')
  const [items, setItems] = useState(sampleItems)
  const feature = features.find((f) => f.id === active)
  const visible = items.filter((i) => enabled.includes(i.feature))

  const enable = (id: string): void => {
    setEnabled([...enabled, id])
    setActive(id)
  }

  const add = (featureId: string): void =>
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        feature: featureId,
        title: 'Untitled',
        date: day(0),
        done: false,
        values: {}
      }
    ])

  const toggle = (id: string): void =>
    setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))

  const remove = (id: string): void => setItems(items.filter((i) => i.id !== id))

  return (
    <div className="flex h-screen w-full font-sans">
      <Rail enabled={enabled} active={active} onSelect={setActive} onAdd={enable} />
      {feature ? (
        <Page
          key={feature.id}
          feature={feature}
          items={items.filter((i) => i.feature === feature.id)}
          onAdd={() => add(feature.id)}
          onToggle={toggle}
          onRemove={remove}
        />
      ) : (
        <Dashboard items={visible} enabled={enabled} onOpen={setActive} />
      )}
    </div>
  )
}

export default App
