import type { Exercise, Unit } from '../../../shared/cali'

const ex = (
  id: string,
  name: string,
  category: string,
  tier: number,
  branch = 'standard',
  unit: Unit = 'reps',
  requires: string[] = []
): Exercise => ({ id, name, category, branch, tier, unit, requires })

export const exercises: Exercise[] = [
  ex('wall-pushup', 'Wall Push-up', 'pushups', 1),
  ex('incline-pushup', 'Incline Push-up', 'pushups', 2, 'standard', 'reps', ['wall-pushup']),
  ex('knee-pushup', 'Knee Push-up', 'pushups', 3, 'standard', 'reps', ['incline-pushup']),
  ex('pushup', 'Push-up', 'pushups', 4, 'standard', 'reps', ['knee-pushup']),
  ex('diamond-pushup', 'Diamond Push-up', 'pushups', 5, 'standard', 'reps', ['pushup']),
  ex('clap-pushup', 'Clap Push-up', 'pushups', 6, 'power', 'reps', ['pushup']),
  ex('archer-pushup', 'Archer Push-up', 'pushups', 7, 'asymmetric', 'reps', ['diamond-pushup']),
  ex('one-arm-pushup', 'One-arm Push-up', 'pushups', 10, 'asymmetric', 'reps', ['archer-pushup']),

  ex('dead-hang', 'Dead Hang', 'pullups', 1, 'isometric', 'seconds'),
  ex('australian-row', 'Australian Row', 'pullups', 2, 'standard', 'reps', ['dead-hang']),
  ex('negative-pullup', 'Negative Pull-up', 'pullups', 3, 'standard', 'reps', ['australian-row']),
  ex('chin-up', 'Chin-up', 'pullups', 4, 'standard', 'reps', ['negative-pullup']),
  ex('pullup', 'Pull-up', 'pullups', 5, 'standard', 'reps', ['chin-up']),
  ex('explosive-pullup', 'Explosive Pull-up', 'pullups', 7, 'power', 'reps', ['pullup']),
  ex('archer-pullup', 'Archer Pull-up', 'pullups', 8, 'asymmetric', 'reps', ['pullup']),
  ex('one-arm-pullup', 'One-arm Pull-up', 'pullups', 11, 'asymmetric', 'reps', ['archer-pullup']),

  ex('assisted-squat', 'Assisted Squat', 'squats', 1),
  ex('squat', 'Bodyweight Squat', 'squats', 2, 'standard', 'reps', ['assisted-squat']),
  ex('split-squat', 'Split Squat', 'squats', 3, 'asymmetric', 'reps', ['squat']),
  ex('jump-squat', 'Jump Squat', 'squats', 4, 'power', 'reps', ['squat']),
  ex('bulgarian-split-squat', 'Bulgarian Split Squat', 'squats', 5, 'asymmetric', 'reps', [
    'split-squat'
  ]),
  ex('shrimp-squat', 'Shrimp Squat', 'squats', 7, 'asymmetric', 'reps', ['bulgarian-split-squat']),
  ex('pistol-squat', 'Pistol Squat', 'squats', 9, 'asymmetric', 'reps', ['shrimp-squat']),

  ex('bench-dip', 'Bench Dip', 'dips', 1),
  ex('negative-dip', 'Negative Dip', 'dips', 2, 'standard', 'reps', ['bench-dip']),
  ex('parallel-bar-dip', 'Parallel Bar Dip', 'dips', 4, 'standard', 'reps', ['negative-dip']),
  ex('ring-dip', 'Ring Dip', 'dips', 6, 'standard', 'reps', ['parallel-bar-dip']),
  ex('korean-dip', 'Korean Dip', 'dips', 7, 'standard', 'reps', ['parallel-bar-dip']),

  ex('plank', 'Plank', 'core', 1, 'isometric', 'seconds'),
  ex('knee-raise', 'Hanging Knee Raise', 'core', 2, 'standard', 'reps', ['plank']),
  ex('hollow-hold', 'Hollow Body Hold', 'core', 3, 'isometric', 'seconds', ['plank']),
  ex('hanging-leg-raise', 'Hanging Leg Raise', 'core', 5, 'standard', 'reps', ['knee-raise']),
  ex('l-sit', 'L-sit', 'core', 6, 'isometric', 'seconds', ['hollow-hold']),
  ex('dragon-flag', 'Dragon Flag', 'core', 9, 'standard', 'reps', ['hanging-leg-raise']),

  ex('glute-bridge', 'Glute Bridge', 'bridges', 1),
  ex('single-leg-bridge', 'Single-leg Glute Bridge', 'bridges', 2, 'asymmetric', 'reps', [
    'glute-bridge'
  ]),
  ex('full-bridge', 'Full Bridge', 'bridges', 4, 'standard', 'reps', ['single-leg-bridge']),
  ex('bridge-hold', 'Bridge Hold', 'bridges', 5, 'isometric', 'seconds', ['full-bridge']),
  ex('wall-walk-bridge', 'Wall-walk Bridge', 'bridges', 6, 'standard', 'reps', ['full-bridge']),
  ex('stand-to-stand', 'Stand-to-stand Bridge', 'bridges', 9, 'standard', 'reps', [
    'wall-walk-bridge'
  ])
]
