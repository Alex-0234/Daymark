# Daymark
A local-first desktop app for organizing tasks and hobbies, with optional modules for workout tracking (starting with calisthenics) and body metrics.

> ⚠️ Early development, temporary README. Features and structure may change.

## Concept

- **Local-first:** all personal data is stored on the user's device in a single SQLite file. No accounts, no cloud.
- **Modular:** a lightweight core for everyday organization, plus optional modules the user can turn on.
- **Portable data:** the database can be exported as a backup and imported again on any device.
- **External APIs only for public data** (exercise and food databases). Personal data is never sent to them.

## Features

### Core
- [ ] Tasks: create, edit, complete, organize
- [ ] Hobbies: track hobbies and related activities

### Optional modules
- [ ] **Workout tracker:** calisthenics first, extendable to any workout type
- [ ] **Body metrics:** weight, measurements and progress over time
- [ ] **Food:** food lookup and logging

### Data
- [ ] Export the database as a backup file
- [ ] Import a backup (with validation and schema migration)
- [ ] Choose whether body metrics are included in an export

## Tech stack

| Area | Technology |
|---|---|
| Desktop shell | Electron (via electron-vite) |
| UI | React, TypeScript, Tailwind CSS |
| Animation | GSAP |
| Database | SQLite (better-sqlite3) |
| ORM / migrations | Drizzle ORM (planned) |
| External APIs | wger (exercises), Open Food Facts (food) |

## Architecture

```
React UI (renderer)  →  preload (window.api)  →  IPC  →  main process  →  SQLite
```

- The **renderer** (React) never accesses the database or Node directly.
- The **preload** script exposes a limited, typed API on `window.api`.
- The **main process** handles the database, file dialogs (import/export) and external API calls.
- API responses are cached in SQLite so the app works offline.

## Project structure

```
src/
  main/        # Main process: windows, database, IPC handlers, API calls
  preload/     # Bridge exposing window.api to the UI
  renderer/    # React app (UI)
```

## Getting started

```bash
# install dependencies
npm install

# run in development (opens the app window with hot reload)
npm run dev

# build an installer
npm run build:win     # Windows
npm run build:mac     # macOS
npm run build:linux   # Linux
```

If you hit a `NODE_MODULE_VERSION` error with better-sqlite3:

```bash
npx @electron/rebuild
```

## Data & backups

- The database is stored in the app's user data folder (`app.getPath('userData')`).
- **Export** uses SQLite's backup API, so it's safe while the app is running.
- **Import** checks file integrity (`PRAGMA integrity_check`) and the schema version (`PRAGMA user_version`), keeps a copy of the current database, then replaces it and runs any needed migrations.

## Privacy

- All personal data stays on the user's device.
- Exported backups contain personal data, so users should store them safely.
- Only general queries (e.g. an exercise or food search) are sent to external APIs.

## Roadmap

1. [X] Electron + React setup
2. [ ] SQLite with the tasks table working end to end
3. [ ] Export / import
4. [ ] Schema migrations
5. [ ] Hobbies module
6. [ ] Workout tracker (calisthenics)
7. [ ] Body metrics module
8. [ ] External API integration (exercises, food)
9. [ ] Optional: database encryption (SQLCipher)

## License

TBD