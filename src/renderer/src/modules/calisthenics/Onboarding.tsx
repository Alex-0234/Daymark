import { useState } from 'react'
import { Crosshair, Dumbbell } from 'lucide-react'
import { useCali } from './useCali'
import { useList } from '../../context/useList'
import { Bar, Button, Card, Label, TierBadge } from './ui'
import { formatValue } from './utils'
import { EVALUATION_STAGES, calibrationBonusEp, calibrationProgress } from '../../utils/calibration'
import { day, nextDate, week, weekday } from '../../data'
import {
  CALI_DEFAULT_SCHEDULE,
  CALI_HOBBY_ID,
  type Calibration,
  type CalibrationResult
} from '../../../../shared/cali'

type Phase = 'intro' | 'personal' | 'schedule' | 'ladder' | 'reps' | 'done'

type PersonalKey = 'name' | 'age' | 'gender' | 'height' | 'weight'

const PERSONAL_STEPS: {
  key: PersonalKey
  field: string
  label: string
  type: 'text' | 'number' | 'select'
  placeholder?: string
}[] = [
  {
    key: 'name',
    field: 'Display name',
    label: 'What should we call you?',
    type: 'text',
    placeholder: 'Name'
  },
  { key: 'age', field: 'Age', label: 'How old are you?', type: 'number', placeholder: '25' },
  { key: 'gender', field: 'Gender', label: 'Gender', type: 'select' },
  {
    key: 'height',
    field: 'Height (cm)',
    label: 'Height in centimetres',
    type: 'number',
    placeholder: '180'
  },
  {
    key: 'weight',
    field: 'Weight (kg)',
    label: 'Weight in kilograms',
    type: 'number',
    placeholder: '75'
  }
]

const GENDERS = ['Male', 'Female', 'Prefer not to say']

// Personal details, the schedule, then a ladder + a rep count per stage.
const TOTAL_STEPS = PERSONAL_STEPS.length + 1 + EVALUATION_STAGES.length * 2

const input =
  'h-10 w-full rounded-lg border border-line-strong bg-bg px-3 text-sm text-fg outline-none select-text placeholder:text-subtle focus:border-muted'

type Props = {
  // Called when the user leaves the intro, so the shell keeps this screen up until done.
  onBegin: () => void
  onClose: () => void
}

function Onboarding({ onBegin, onClose }: Props): React.JSX.Element {
  const { exercises, byId, saveCalibration } = useCali()
  const { lists, updateItem } = useList()
  const hobby = lists.flatMap((l) => l.items).find((i) => i.id === CALI_HOBBY_ID)

  const [phase, setPhase] = useState<Phase>('intro')
  const [personalIndex, setPersonalIndex] = useState(0)
  const [personal, setPersonal] = useState<Record<PersonalKey, string>>({
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: ''
  })
  const [schedule, setSchedule] = useState<number[]>(hobby?.repeat ?? CALI_DEFAULT_SCHEDULE)
  const [stageIndex, setStageIndex] = useState(0)
  const [tierIndex, setTierIndex] = useState(0)
  const [value, setValue] = useState('')
  const [results, setResults] = useState<CalibrationResult[]>([])
  const [summary, setSummary] = useState<{ unlocked: number; bonusEP: number } | null>(null)

  const stage = EVALUATION_STAGES[stageIndex]
  const ladder = stage.ladder.filter((id) => byId[id])
  const current = byId[ladder[tierIndex]]

  const stepNumber =
    phase === 'personal'
      ? personalIndex + 1
      : phase === 'schedule'
        ? PERSONAL_STEPS.length + 1
        : PERSONAL_STEPS.length + 1 + stageIndex * 2 + (phase === 'reps' ? 2 : 1)

  const personalStep = PERSONAL_STEPS[personalIndex]
  const personalValue = personal[personalStep.key]
  const canAdvancePersonal =
    personalStep.type === 'number' ? Number(personalValue) > 0 : personalValue.trim().length > 0
  const amount = Number(value)

  const goBack = (): void => {
    if (phase === 'personal') {
      if (personalIndex > 0) setPersonalIndex((i) => i - 1)
      else setPhase('intro')
    } else if (phase === 'schedule') {
      setPersonalIndex(PERSONAL_STEPS.length - 1)
      setPhase('personal')
    } else if (phase === 'reps') {
      setValue('')
      setPhase('ladder')
    } else if (phase === 'ladder') {
      if (tierIndex > 0) setTierIndex((i) => i - 1)
      else if (stageIndex > 0) {
        setResults((prev) =>
          prev.filter((r) => r.category !== EVALUATION_STAGES[stageIndex - 1].category)
        )
        setStageIndex((i) => i - 1)
      } else setPhase('schedule')
    }
  }

  const finish = (all: CalibrationResult[]): void => {
    const weight = Number(personal.weight)
    const bonusEP = calibrationBonusEp(all, exercises)
    const calibration: Calibration = {
      completedAt: new Date().toISOString(),
      skipped: false,
      profile: {
        name: personal.name.trim(),
        age: Number(personal.age) || 0,
        gender: personal.gender,
        height: Number(personal.height) || 0,
        weight: weight > 0 ? weight : 0
      },
      results: all,
      bonusEP
    }
    saveCalibration(calibration)

    if (hobby) {
      const date = schedule.includes(weekday(day())) ? day() : nextDate(day(), schedule)
      updateItem(hobby.listId, hobby.id, { repeat: schedule, date })
    }

    setSummary({ unlocked: Object.keys(calibrationProgress(all, exercises)).length, bonusEP })
    setPhase('done')
  }

  const nextStage = (all: CalibrationResult[]): void => {
    setResults(all)
    setTierIndex(0)
    setValue('')
    if (stageIndex < EVALUATION_STAGES.length - 1) {
      setStageIndex((i) => i + 1)
      setPhase('ladder')
    } else finish(all)
  }

  // Walk up the ladder while the answer is yes. The first "no" (or the top) fixes the
  // variation we ask a max for. "No" on the very first step skips the category.
  const answerLadder = (canDo: boolean): void => {
    if (canDo && tierIndex < ladder.length - 1) setTierIndex((i) => i + 1)
    else if (!canDo && tierIndex === 0) nextStage(results)
    else {
      if (!canDo) setTierIndex((i) => i - 1)
      setPhase('reps')
    }
  }

  const submitReps = (): void =>
    nextStage([
      ...results.filter((r) => r.category !== stage.category),
      { category: stage.category, exerciseId: current.id, value: amount }
    ])

  const skip = (): void => {
    saveCalibration({
      completedAt: new Date().toISOString(),
      skipped: true,
      profile: null,
      results: [],
      bonusEP: 0
    })
    onClose()
  }

  const step = (label: string, title: string, sub?: string): React.JSX.Element => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      {sub && <p className="text-sm text-accent">{sub}</p>}
    </div>
  )

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-bg">
      <header className="shrink-0 border-b border-line">
        <div className="flex h-12 items-center gap-2.5 px-5">
          <Dumbbell size={16} className="text-orange-400 drop-shadow-[0_0_6px_currentColor]" />
          <h1 className="glow text-sm font-semibold text-fg">Calibration</h1>
        </div>
        {phase !== 'intro' && phase !== 'done' && (
          <Bar value={stepNumber} max={TOTAL_STEPS} className="h-0.5 rounded-none" />
        )}
      </header>

      <div className="flex flex-1 items-center justify-center overflow-y-auto p-5">
        <Card className="w-full max-w-md space-y-5 p-6">
          {phase === 'intro' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <Crosshair size={40} className="text-accent drop-shadow-[0_0_8px_var(--accent)]" />
              <h2 className="glow text-xl font-bold text-fg">Initial evaluation</h2>
              <p className="max-w-xs text-sm leading-relaxed text-muted">
                A few questions about you, your training days, then the hardest variation you can
                manage in four categories. Everything below that unlocks right away, and the closer
                you are to the next step, the more bonus EP you start with.
              </p>
              <Button
                variant="primary"
                className="w-full py-2.5"
                onClick={() => {
                  onBegin()
                  setPhase('personal')
                }}
              >
                Begin calibration
              </Button>
              <button onClick={skip} className="text-xs text-subtle hover:text-fg">
                Skip for now
              </button>
            </div>
          )}

          {phase === 'personal' && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault()
                if (!canAdvancePersonal) return
                if (personalIndex < PERSONAL_STEPS.length - 1) setPersonalIndex((i) => i + 1)
                else setPhase('schedule')
              }}
            >
              {step(
                `Personal details · ${personalIndex + 1}/${PERSONAL_STEPS.length}`,
                personalStep.label
              )}
              <label className="block space-y-1.5">
                <span className="text-xs text-muted">{personalStep.field}</span>
                {personalStep.type === 'select' ? (
                  <select
                    key={personalStep.key}
                    autoFocus
                    value={personalValue}
                    onChange={(e) =>
                      setPersonal({ ...personal, [personalStep.key]: e.target.value })
                    }
                    className={input}
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    key={personalStep.key}
                    autoFocus
                    type={personalStep.type}
                    min={personalStep.type === 'number' ? 1 : undefined}
                    placeholder={personalStep.placeholder}
                    value={personalValue}
                    onChange={(e) =>
                      setPersonal({ ...personal, [personalStep.key]: e.target.value })
                    }
                    className={input}
                  />
                )}
              </label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={goBack}>
                  Back
                </Button>
                <button
                  type="submit"
                  disabled={!canAdvancePersonal}
                  className="flex-1 rounded-lg bg-accent py-1.5 text-xs font-medium text-accent-fg shadow-panel transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </form>
          )}

          {phase === 'schedule' && (
            <>
              {step(
                'Training days',
                'Which days will you train?',
                'Missing one of these days resets your streak. You can change them later in Hobbies.'
              )}
              <div className="flex gap-1">
                {week.map((w) => {
                  const on = schedule.includes(w.day)
                  return (
                    <button
                      key={w.day}
                      onClick={() =>
                        setSchedule((prev) =>
                          on ? prev.filter((d) => d !== w.day) : [...prev, w.day]
                        )
                      }
                      className={`h-10 flex-1 rounded-lg text-xs font-medium transition-colors ${
                        on
                          ? 'bg-accent text-accent-fg shadow-panel'
                          : 'border border-line-strong text-subtle hover:text-fg'
                      }`}
                    >
                      {w.name}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={goBack}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={schedule.length === 0}
                  onClick={() => {
                    setStageIndex(0)
                    setTierIndex(0)
                    setPhase('ladder')
                  }}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {phase === 'ladder' && current && (
            <>
              {step(
                `${stage.name} · step ${tierIndex + 1}/${ladder.length}`,
                current.unit === 'seconds'
                  ? 'Can you hold this for a few seconds?'
                  : 'Can you do at least one clean rep?',
                current.name
              )}
              <div className="flex items-center gap-2 text-xs text-subtle">
                <TierBadge tier={current.tier} />
                <span className="capitalize">{current.branch}</span>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  className="flex-1 border border-danger/40 py-2.5"
                  onClick={() => answerLadder(false)}
                >
                  {tierIndex === 0 ? 'No · skip category' : 'No · too hard'}
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 py-2.5"
                  onClick={() => answerLadder(true)}
                >
                  Yes
                </Button>
              </div>
              <button onClick={goBack} className="text-xs text-subtle hover:text-fg">
                ← Back
              </button>
            </>
          )}

          {phase === 'reps' && current && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault()
                if (amount > 0) submitReps()
              }}
            >
              {step(
                stage.name,
                current.unit === 'seconds' ? 'Longest hold' : 'Max reps to failure',
                current.name
              )}
              <label className="block space-y-1.5">
                <span className="text-xs text-muted">
                  {current.unit === 'seconds' ? 'Seconds held' : 'Reps'}
                </span>
                <input
                  autoFocus
                  type="number"
                  min={1}
                  placeholder="0"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className={input}
                />
              </label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={goBack}>
                  Back
                </Button>
                <button
                  type="submit"
                  disabled={!(amount > 0)}
                  className="flex-1 rounded-lg bg-accent py-1.5 text-xs font-medium text-accent-fg shadow-panel transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
                >
                  {stageIndex < EVALUATION_STAGES.length - 1
                    ? 'Log & continue'
                    : 'Complete calibration'}
                </button>
              </div>
            </form>
          )}

          {phase === 'done' && summary && (
            <>
              {step('Calibration complete', 'Starting line set')}
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Unlocked', summary.unlocked],
                  ['Bonus EP', `+${summary.bonusEP}`]
                ].map(([label, v]) => (
                  <div key={label} className="rounded-lg bg-raised px-4 py-3 shadow-panel">
                    <Label>{label}</Label>
                    <p className="font-mono text-xl font-semibold text-fg tabular-nums">{v}</p>
                  </div>
                ))}
              </div>
              <ul className="divide-y divide-line text-xs">
                {EVALUATION_STAGES.map((s) => {
                  const r = results.find((x) => x.category === s.category)
                  const e = r && byId[r.exerciseId]
                  return (
                    <li key={s.category} className="flex items-center justify-between gap-3 py-2">
                      <span className="text-subtle">{s.name}</span>
                      <span className="truncate text-fg">
                        {e ? (
                          <>
                            {e.name}{' '}
                            <span className="text-accent">× {formatValue(r.value, e)}</span>
                          </>
                        ) : (
                          <span className="text-subtle">Skipped</span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
              <Button variant="primary" className="w-full py-2.5" onClick={onClose}>
                Start training
              </Button>
            </>
          )}
        </Card>
      </div>
    </main>
  )
}

export default Onboarding
