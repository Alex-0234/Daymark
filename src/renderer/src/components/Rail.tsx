import { useState } from 'react'
import { LayoutDashboard, Plus, Settings as SettingsIcon } from 'lucide-react'
import { features } from '../features'
import { useTheme } from '../theme'
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
  const [theme, setTheme] = useTheme()
  const available = features.filter((f) => !enabled.includes(f.id))
  const item = `flex h-9 items-center gap-2.5 rounded-lg text-sm transition-all ${wide ? 'w-full px-2.5' : 'w-9 justify-center'}`
  const idle = 'text-muted hover:bg-raised hover:text-fg'
  const current = 'bg-raised text-fg shadow-panel'

  return (
    <nav
      className={`flex shrink-0 flex-col items-center gap-1.5 border-r border-line bg-panel py-3 transition-all ${wide ? 'w-48 px-2' : 'w-14'}`}
    >
      <button
        onClick={() => onSelect('dashboard')}
        title="Dashboard"
        className={`${item} ${active === 'dashboard' ? current : idle}`}
      >
        <LayoutDashboard size={18} className="shrink-0" />
        {wide && <span>Dashboard</span>}
      </button>
      <div className={`my-1 h-px bg-line ${wide ? 'w-full' : 'w-6'}`} />

      {features
        .filter((f) => enabled.includes(f.id))
        .map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            title={f.name}
            className={`${item} ${f.id === active ? current : idle}`}
          >
            <f.icon
              size={18}
              className={`shrink-0 ${f.id === active ? `${f.text} drop-shadow-[0_0_6px_currentColor]` : ''}`}
            />
            {wide && <span className="truncate">{f.name}</span>}
          </button>
        ))}

      {available.length > 0 && (
        <div className={`relative ${wide ? 'w-full' : ''}`}>
          <button
            onClick={() => setOpen(!open)}
            title="Add module"
            className={`${item} border border-dashed border-line-strong text-subtle hover:border-muted hover:text-fg`}
          >
            <Plus size={18} className="shrink-0" />
            {wide && <span>Add module</span>}
          </button>
          {open && (
            <div className="absolute top-0 left-full z-10 ml-3 w-52 rounded-xl bg-panel p-1.5 shadow-pop">
              <p className="px-2 py-1.5 text-[11px] font-medium tracking-wider text-subtle uppercase">
                Add module
              </p>
              {available.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    onAdd(f.id)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-raised hover:text-fg"
                >
                  <f.icon size={16} className={f.text} />
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
        className={`${item} mt-auto ${idle}`}
      >
        <SettingsIcon size={18} className="shrink-0" />
        {wide && <span>Settings</span>}
      </button>

      {settingsOpen && (
        <Settings
          wide={wide}
          onWideChange={setWide}
          theme={theme}
          onThemeChange={setTheme}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </nav>
  )
}

export default Rail
