import { useState } from 'react'
import { Download, Upload, X } from 'lucide-react'
import { themes } from '../theme'

type Status = { tone: 'ok' | 'error'; text: string } | null

function DataSection(): React.JSX.Element {
  const [includeMetrics, setIncludeMetrics] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<Status>(null)

  const exportData = async (): Promise<void> => {
    setBusy(true)
    setStatus(null)
    try {
      const result = await window.api.data.export(includeMetrics)
      if (result) setStatus({ tone: 'ok', text: `Saved to ${result.path}` })
    } catch (e) {
      setStatus({ tone: 'error', text: `Export failed: ${(e as Error).message}` })
    } finally {
      setBusy(false)
    }
  }

  const importData = async (): Promise<void> => {
    setBusy(true)
    setStatus(null)
    try {
      const result = await window.api.data.import()
      if (!result) return
      if (!result.ok) return setStatus({ tone: 'error', text: result.error })
      location.reload() // every provider reloads from the new database
    } catch (e) {
      setStatus({ tone: 'error', text: `Import failed: ${(e as Error).message}` })
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  const button =
    'flex flex-1 items-center justify-center gap-2 rounded-lg bg-raised px-3 py-2 text-sm text-fg shadow-panel hover:ring-1 hover:ring-accent disabled:opacity-50'

  return (
    <>
      <p className="mt-5 mb-2 text-[11px] font-medium tracking-wider text-subtle uppercase">Data</p>
      <label className="mb-2 flex cursor-pointer items-center justify-between rounded-lg bg-raised px-3 py-2.5 shadow-panel">
        <span>
          <span className="block text-sm text-fg">Include body metrics</span>
          <span className="block text-xs text-muted">Weight, body fat and measurements</span>
        </span>
        <input
          type="checkbox"
          checked={includeMetrics}
          onChange={(e) => setIncludeMetrics(e.target.checked)}
          className="peer sr-only"
        />
        <span className="relative h-5 w-9 rounded-full bg-line-strong transition-colors peer-checked:bg-accent after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-fg after:transition-transform peer-checked:after:translate-x-4 peer-checked:after:bg-accent-fg" />
      </label>

      {confirming ? (
        <div className="rounded-lg bg-raised px-3 py-2.5 shadow-panel">
          <p className="mb-2 text-xs text-muted">
            Importing replaces all current data. A copy of it is kept in the app&apos;s backups
            folder first.
          </p>
          <div className="flex gap-2">
            <button disabled={busy} onClick={importData} className={button}>
              Choose file…
            </button>
            <button disabled={busy} onClick={() => setConfirming(false)} className={button}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button disabled={busy} onClick={exportData} className={button}>
            <Download size={14} /> Export…
          </button>
          <button disabled={busy} onClick={() => setConfirming(true)} className={button}>
            <Upload size={14} /> Import…
          </button>
        </div>
      )}

      {status && (
        <p
          className={`mt-2 text-xs break-all ${status.tone === 'error' ? 'text-danger' : 'text-muted'}`}
        >
          {status.text}
        </p>
      )}
      <p className="mt-2 text-xs text-subtle">Backups contain personal data. Store them safely.</p>
    </>
  )
}

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

        <DataSection />
      </div>
    </div>
  )
}

export default Settings
