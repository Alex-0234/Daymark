export type MetricKey = 'weight' | 'bodyFat' | 'waist' | 'chest' | 'hips' | 'arm' | 'thigh'

export const METRICS: { key: MetricKey; label: string; unit: string; step: number }[] = [
  { key: 'weight', label: 'Weight', unit: 'kg', step: 0.1 },
  { key: 'bodyFat', label: 'Body fat', unit: '%', step: 0.1 },
  { key: 'waist', label: 'Waist', unit: 'cm', step: 0.5 },
  { key: 'chest', label: 'Chest', unit: 'cm', step: 0.5 },
  { key: 'hips', label: 'Hips', unit: 'cm', step: 0.5 },
  { key: 'arm', label: 'Arm', unit: 'cm', step: 0.5 },
  { key: 'thigh', label: 'Thigh', unit: 'cm', step: 0.5 }
]

// One entry per day; only the measurements taken that day are set.
export type MetricEntry = {
  date: string
  values: Partial<Record<MetricKey, number>>
}

export type MetricsApi = {
  entries: () => Promise<MetricEntry[]>
  save: (entry: MetricEntry) => Promise<void>
  remove: (date: string) => Promise<void>
  // Most recent logged weight, or null (also when the module isn't enabled).
  latestWeight: () => Promise<number | null>
}
