export type MainModule = {
  id: string
  migrations: (() => void)[]
  seed?: () => void
  registerIpc: () => void
}
