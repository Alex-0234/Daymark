import { useState } from 'react'
import { LayoutDashboard, Plus, Settings as SettingsIcon } from 'lucide-react'
import { features } from '../features'
import Settings from './Settings'

type Props = {
  enabled: string[]
  active: string
  onSelect: (id: string) => void
  onAdd: (id: string) => void
}

function Rail({ enabled, active, onSelect, onAdd }: Props): React.JSX.Element {
  const [wide, setWide] = useState(false)
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const available = features.filter((f) => !enabled.includes(f.id))
  const item = `flex h-9 items-center gap-2 transition-all ${wide ? 'w-full rounded-lg px-2' : 'w-9 justify-center'}`
  const round = wide ? '' : 'rounded-2xl hover:rounded-xl'

  return (
    <nav
      className={`flex shrink-0 flex-col items-center gap-2 bg-[#1e1f22] py-3 transition-all ${wide ? 'w-44 px-2' : 'w-12'}`}
    >
      <button
        onClick={() => onSelect('dashboard')}
        title="Dashboard"
        className={`${item} shrink-0 ${
          active === 'dashboard'
            ? `bg-white text-[#1e1f22] ${wide ? '' : 'rounded-xl'}`
            : `bg-[#313338] text-zinc-300 hover:bg-white hover:text-[#1e1f22] ${round}`
        }`}
      >
        <LayoutDashboard size={20} className="shrink-0" />
        {wide && <span className="text-sm">Dashboard</span>}
      </button>
      <div className="h-0.5 w-8 rounded bg-white/10" />

      {features
        .filter((f) => enabled.includes(f.id))
        .map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            title={f.name}
            className={`${item} ${
              f.id === active
                ? `text-white ${f.color} ${wide ? '' : 'rounded-xl'}`
                : `bg-[#313338] text-zinc-300 hover:text-white ${f.hover} ${round}`
            }`}
          >
            <f.icon size={20} className="shrink-0" />
            {wide && <span className="truncate text-sm">{f.name}</span>}
          </button>
        ))}

      {available.length > 0 && (
        <div className={`relative ${wide ? 'w-full' : ''}`}>
          <button
            onClick={() => setOpen(!open)}
            title="Add module"
            className={`${item} ${round} bg-[#313338] text-emerald-400 hover:bg-emerald-500 hover:text-white`}
          >
            <Plus size={20} className="shrink-0" />
            {wide && <span className="text-sm">Add module</span>}
          </button>
          {open && (
            <div className="absolute top-0 left-full z-10 ml-2 w-52 rounded-lg bg-[#111214] p-2 shadow-xl">
              <p className="px-2 pb-1 text-xs font-semibold text-zinc-400 uppercase">Add module</p>
              {available.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    onAdd(f.id)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-zinc-200 hover:bg-indigo-500"
                >
                  <f.icon size={16} />
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setSettingsOpen(true)}
        title="Settings"
        className={`${item} mt-auto rounded-xl text-zinc-400 hover:bg-white/10 hover:text-zinc-200`}
      >
        <SettingsIcon size={20} className="shrink-0" />
        {wide && <span className="text-sm">Settings</span>}
      </button>

      {settingsOpen && (
        <Settings wide={wide} onWideChange={setWide} onClose={() => setSettingsOpen(false)} />
      )}
    </nav>
  )
}

export default Rail
