import { X } from 'lucide-react'

type Props = {
  wide: boolean
  onWideChange: (wide: boolean) => void
  onClose: () => void
}

function Settings({ wide, onWideChange, onClose }: Props): React.JSX.Element {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/60"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-96 rounded-lg bg-[#313338] p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
          >
            <X size={18} />
          </button>
        </div>
        <label className="flex cursor-pointer items-center justify-between rounded-md bg-[#2b2d31] px-3 py-2.5">
          <span>
            <span className="block text-sm text-zinc-200">Wide rail</span>
            <span className="block text-xs text-zinc-500">Show feature names next to icons</span>
          </span>
          <input
            type="checkbox"
            checked={wide}
            onChange={(e) => onWideChange(e.target.checked)}
            className="peer sr-only"
          />
          <span className="relative h-5 w-9 rounded-full bg-zinc-600 transition-colors peer-checked:bg-indigo-500 after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
        </label>
      </div>
    </div>
  )
}

export default Settings
