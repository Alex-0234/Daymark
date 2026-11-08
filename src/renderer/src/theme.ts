import { useEffect, useState } from 'react'

export const themes = [
  { id: 'midnight', name: 'Midnight', swatch: '#030304' },
  { id: 'graphite', name: 'Graphite', swatch: '#141416' },
  { id: 'ocean', name: 'Ocean', swatch: '#0a0e15' },
  { id: 'light', name: 'Light', swatch: '#ffffff' }
]

const read = (): string => {
  try {
    return localStorage.getItem('theme') ?? 'midnight'
  } catch {
    return 'midnight'
  }
}

export function useTheme(): [string, (theme: string) => void] {
  const [theme, setTheme] = useState(read)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('theme', theme)
    } catch {
      return
    }
  }, [theme])

  return [theme, setTheme]
}
