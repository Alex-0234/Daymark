import { X } from 'lucide-react'
import { themes } from '../theme'

type Props = {
  wide: boolean
  onWideChange: (wide: boolean) => void
  theme: string
  onThemeChange: (theme: string) => void
  onClose: () => void
}

function Settings({ wide, onWideChange, theme, onThemeChange, onClose }: Props): React.JSX.Element {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[26rem] rounded-2xl bg-panel p-5 shadow-pop"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="glow text-base font-semibold text-fg">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-subtle hover:bg-raised hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mb-2 text-[11px] font-medium tracking-wider text-subtle uppercase">Theme</p>
        <div className="mb-5 grid grid-cols-4 gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={`rounded-lg p-1.5 text-xs transition-all ${
                theme === t.id
                  ? 'bg-raised text-fg shadow-panel ring-1 ring-accent'
                  : 'text-muted hover:bg-raised hover:text-fg'
              }`}
            >
              <span
                style={{ background: t.swatch }}
                className="mb-1.5 block h-10 rounded-md border border-line-strong"
              />
              {t.name}
            </button>
          ))}
        </div>

        <p className="mb-2 text-[11px] font-medium tracking-wider text-subtle uppercase">Layout</p>
        <label className="flex cursor-pointer items-center justify-between rounded-lg bg-raised px-3 py-2.5 shadow-panel">
          <span>
            <span className="block text-sm text-fg">Wide rail</span>
            <span className="block text-xs text-muted">Show feature names next to icons</span>
          </span>
          <input
            type="checkbox"
            checked={wide}
            onChange={(e) => onWideChange(e.target.checked)}
            className="peer sr-only"
          />
          <span className="relative h-5 w-9 rounded-full bg-line-strong transition-colors peer-checked:bg-accent after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-fg after:transition-transform peer-checked:after:translate-x-4 peer-checked:after:bg-accent-fg" />
        </label>
      </div>
    </div>
  )
}

export default Settings
