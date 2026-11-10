import { Flame, Play } from 'lucide-react'
import { useCali } from './useCali'
import { MAX_LEVEL, calculateLevel, rankTitle, workoutXp } from '../../utils/level'
import { AP_STATES, STATS, calculatePlayerStats } from '../../utils/stats'
import { Bar, Button, Card, Elapsed, Label, TierBadge } from './ui'
import SetsChart from './SetsChart'
import { CATEGORIES, formatDay, formatDuration, formatValue, totalSets } from './utils'
import { day, toDay, weekday } from '../../data'

function LevelRing({ level, progress }: { level: number; progress: number }): React.JSX.Element {
  const r = 45
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="5" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          className="drop-shadow-[0_0_6px_var(--accent)] transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9px] tracking-widest text-subtle uppercase">Lvl</span>
        <span className="glow font-mono text-2xl leading-none font-bold text-fg tabular-nums">
          {level}
        </span>
      </div>
    </div>
  )
}

function Status({
  onStart,
  onCalibrate
}: {
  onStart: () => void
  onCalibrate: () => void
}): React.JSX.Element {
  const {
    workouts,
    exercises,
    byId,
    progress,
    draft,
    ep,
    rating,
    streak,
    schedule,
    calibration,
    bodyweight
  } = useCali()
  const stats = calculatePlayerStats(workouts, exercises, progress, bodyweight)
  const name = calibration?.profile?.name
  const level = calculateLevel(workouts, byId, bodyweight)
  const power = Math.round(STATS.reduce((a, s) => a + stats[s.key], 0) / STATS.length)

  const week = Array.from({ length: 7 }, (_, i) => day(i - 6))
  const trainedDays = new Set(workouts.map((w) => toDay(new Date(w.finishedAt))))
  const isScheduled = (d: string): boolean => schedule.includes(weekday(d))

  const bests = CATEGORIES.map((c) => {
    let best: { id: string; tier: number; value: number } | null = null
    for (const w of workouts)
      for (const e of w.exercises) {
        const ex = byId[e.exerciseId]
        if (ex?.category !== c.id) continue
        const value = Math.max(...e.sets.map((s) => s.value))
        if (!best || ex.tier > best.tier || (ex.tier === best.tier && value > best.value))
          best = { id: ex.id, tier: ex.tier, value }
      }
    return { category: c, best }
  })

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
      <Card className="relative overflow-hidden lg:sticky lg:top-0">
        <div className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative flex items-center justify-between border-b border-line px-5 py-3">
          <Label>{name ? `Status · ${name}` : 'Status'}</Label>
          <span className="font-mono text-[11px] text-subtle tabular-nums">PWR {power}</span>
        </div>

        <div className="relative flex items-center gap-4 px-5 pt-4">
          <LevelRing level={level.level} progress={level.progress} />
          <div className="min-w-0 flex-1">
            <p className="glow truncate text-xl font-bold tracking-tight text-fg">
              {rankTitle(level.level)}
            </p>
            <p className="mb-2 text-xs text-muted tabular-nums">
              {level.level >= MAX_LEVEL ? 'MAX' : Math.round(level.xp)} / {Math.round(level.needed)}{' '}
              XP
            </p>
            <Bar value={level.progress} max={1} className="h-1" />
          </div>
        </div>

        <div className="relative grid grid-cols-4 gap-px px-5 pt-4 pb-1">
          {[
            ['EP', ep, 'Evolution points, spent on unlocking exercises'],
            ['Rating', rating, 'Rises when you finish workouts harder than your current rating'],
            ['Streak', streak.current, `Best ${streak.highest}. A missed scheduled day resets it.`],
            ['Sessions', workouts.length, `${Math.round(level.total)} total XP`]
          ].map(([label, value, hint]) => (
            <div key={label} title={String(hint)}>
              <Label>{label}</Label>
              <p className="font-mono text-sm font-semibold text-fg tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        <ul className="relative space-y-3 px-5 pt-3 pb-5">
          {STATS.map((s) => (
            <li
              key={s.key}
              title={s.hint}
              className="grid grid-cols-[2.5rem_1fr_2.75rem] items-center gap-3"
            >
              <span
                className="font-mono text-xs font-bold tracking-widest"
                style={{ color: s.color, textShadow: `0 0 10px ${s.color}88` }}
              >
                {s.key}
              </span>
              <div className="min-w-0">
                <p className="mb-1 truncate text-xs text-muted">{s.name}</p>
                <Bar value={stats[s.key]} max={1000} color={s.color} className="h-1" />
              </div>
              <span className="text-right font-mono text-sm font-semibold text-fg tabular-nums">
                {stats[s.key]}
              </span>
            </li>
          ))}
          <li className="text-[11px] leading-relaxed text-subtle">{AP_STATES[stats.apState]}</li>
        </ul>
      </Card>

      <div className="grid gap-5 2xl:grid-cols-2">
        <Card className="flex items-center gap-4 p-4 2xl:col-span-2">
          {draft ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg">{draft.name} in progress</p>
                <p className="font-mono text-xs text-muted tabular-nums">
                  <Elapsed since={draft.startedAt} /> · {draft.exercises.length} exercises
                </p>
              </div>
              <Button variant="primary" onClick={onStart}>
                Resume
              </Button>
            </>
          ) : (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fg">
                  {workouts.length === 0 ? 'No sessions yet' : 'Ready to train'}
                </p>
                <p className="text-xs text-muted">
                  {workouts.length === 0
                    ? 'Log your first workout to start earning XP.'
                    : `Last session ${formatDay(workouts[0].finishedAt)}`}
                </p>
              </div>
              <Button variant="primary" onClick={onStart}>
                <Play size={13} />
                Start workout
              </Button>
            </>
          )}
        </Card>

        {calibration?.skipped && (
          <Card className="flex items-center gap-4 p-4 2xl:col-span-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">Calibration skipped</p>
              <p className="text-xs text-muted">
                Benchmark yourself to unlock exercises you can already do and get bonus EP.
              </p>
            </div>
            <Button variant="outline" onClick={onCalibrate}>
              Calibrate
            </Button>
          </Card>
        )}

        <Card className="p-4 2xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <Label>Last 7 days</Label>
            <span
              title={`Best streak ${streak.highest}`}
              className="flex items-center gap-1 text-xs text-muted"
            >
              <Flame size={13} className="text-orange-400" />
              {streak.current} streak{streak.dueToday && ' · train today to keep it'}
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {week.map((d) => {
              const trained = trainedDays.has(d)
              const scheduled = isScheduled(d)
              const missed = scheduled && !trained && d < day()
              return (
                <div key={d} className="flex flex-col items-center gap-1.5">
                  <div
                    title={
                      trained ? 'Trained' : missed ? 'Missed' : scheduled ? 'Scheduled' : 'Rest day'
                    }
                    className={`h-7 w-full rounded-md border ${
                      trained
                        ? 'border-accent bg-accent shadow-[0_0_10px_-2px_var(--accent)]'
                        : missed
                          ? 'border-danger/50 bg-danger/10'
                          : scheduled
                            ? 'border-dashed border-muted bg-bg'
                            : 'border-line bg-bg'
                    }`}
                  />
                  <span
                    className={`flex flex-col items-center text-[10px] leading-tight tabular-nums ${
                      d === day() ? 'glow font-semibold text-fg' : 'text-subtle'
                    }`}
                  >
                    <span>
                      {d === day()
                        ? 'Today'
                        : new Date(`${d}T00:00`).toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <span>{new Date(`${d}T00:00`).getDate()}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        <SetsChart />

        <Card className="p-4">
          <Label className="mb-3">Personal bests</Label>
          <ul className="space-y-2.5">
            {bests.map(({ category, best }) => (
              <li key={category.id} className="flex items-center gap-2.5 text-xs">
                <span className="w-16 shrink-0 text-subtle">{category.name}</span>
                {best ? (
                  <>
                    <TierBadge tier={best.tier} />
                    <span className="min-w-0 flex-1 truncate text-fg">{byId[best.id]?.name}</span>
                    <span className="text-muted tabular-nums">
                      {formatValue(best.value, byId[best.id])}
                    </span>
                  </>
                ) : (
                  <span className="text-subtle">—</span>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <Label className="mb-3">Recent sessions</Label>
          <ul className="space-y-2.5">
            {workouts.slice(0, 5).map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0">
                  <span className="block truncate text-fg">{w.name}</span>
                  <span className="text-subtle">
                    {formatDay(w.finishedAt)} · {formatDuration(w.duration)} · {totalSets(w)} sets
                  </span>
                </span>
                <span className="shrink-0 font-mono text-muted">
                  +{Math.round(workoutXp(w, byId, bodyweight))}
                </span>
              </li>
            ))}
            {workouts.length === 0 && <li className="text-xs text-subtle">Nothing logged yet.</li>}
          </ul>
        </Card>
      </div>
    </div>
  )
}

export default Status
