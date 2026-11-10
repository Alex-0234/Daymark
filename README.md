# Daymark

A local-first desktop app for organizing tasks and hobbies, with optional add-on modules for workout tracking (starting with calisthenics) and body metrics.

> ⚠️ Early development, temporary README. Features and structure may change.

## Concept

- **Local-first:** all personal data is stored on the user's device in a single SQLite file. No accounts, no cloud.
- **Modular:** a lightweight core for everyday organization, plus optional add-on modules the user can turn on from the **+** button in the sidebar.
- **Portable data:** the database can be exported as a backup and imported again on any device (Settings → Data).
- **External APIs only for public data** (exercise and food databases). Personal data is never sent to them.

## Features

### App shell

- [x] Discord-style icon rail: Dashboard, enabled features, **+** to add modules, Settings
- [x] Dashboard summarizing every enabled feature (open/done counts, what's next)
- [x] 7-day "what's next" calendar strip on every page
- [x] Themes: Midnight (default, near-black), Graphite, Ocean, Light. All colors come from CSS variables on `:root`
- [x] Settings: theme picker, wide rail (icons with labels)

### Core

- [x] **Tasks:** add, edit inline, complete, delete, repeat on chosen weekdays
- [x] **Hobbies:** same list system as tasks, with their own columns
- [x] Module-owned items: a module can add a locked item (editable, not deletable, always keeps a repeat), e.g. the Calisthenics hobby
- [x] Resizable columns (drag any cell edge, clamped to min/max, saved per list)
- [x] Repeating items: ticking the checkbox moves the item to its next selected weekday

### Optional modules

- [x] **Calisthenics** (add-on, see below)
- [x] **Body metrics:** weight, body fat and measurements per day, latest values with change, history
- [ ] **Food:** food lookup and logging

### Data

- [x] SQLite database with versioned migrations
- [x] Export the database as a backup file
- [x] Import a backup (with validation and schema migration)
- [x] Choose whether body metrics are included in an export

## Calisthenics module

A gamified calisthenics tracker, ported and redesigned from a previous project (Cali Ascension).

- **Onboarding (calibration):** personal details, training days, then a "can you do one rep?" ladder and a max for push-ups, squats, core and pull-ups. Everything at or below the result unlocks, with estimated bests, bonus EP and a starting rating. Can be skipped and run later from Status.
- **Status:** level, rank, XP, EP, rating, streak, sessions and six stats (STR, HYP, END, POW, BAL, AP), plus the last 7 days (scheduled / missed / trained), sets per week by movement group (chart or table), personal bests and recent sessions.
- **Workout logging:** a set table per exercise (Set / Previous / Reps / ✓), previous values shown as hints, rest timer, live duration/sets/XP, add, remove and reorder exercises and sets mid-session. The active workout is saved continuously and can be resumed after a restart.
- **Routines:** create, edit, reorder and delete routines. Start a session from a routine or empty.
- **Exercise library:** exercises by category and tier, as a list or a skill tree, with proficiency, personal bests and EP unlocks.
- **Unlocks:** exercises without prerequisites, already-trained ones and calibrated ones are unlocked. Others cost EP once their prerequisites are unlocked and have a personal best of 8 reps / 20 s. Locked exercises can't be added to a workout or routine.
- **Schedule & streak:** enabling the module adds a permanent **Calisthenics** hobby. Its repeat days are the training schedule; finishing a workout moves it to the next scheduled day. Every training day adds 1 to the streak, a missed scheduled day resets it, other days are rest days.
- **History:** finished sessions with sets, reps and XP.

It's a true add-on:

- Its UI is lazy-loaded as a separate chunk, only when the page is opened.
- Its tables and exercise data are installed into the database only when the module is enabled.
- Enabled modules are remembered in the database.

**Where the formulas live** (`src/renderer/src/utils/`):

| File             | What it calculates                                                                      |
| ---------------- | --------------------------------------------------------------------------------------- |
| `stats.ts`       | STR, HYP, END, POW, BAL, AP (acute:chronic load) from bests and recent sets             |
| `level.ts`       | XP per set (relative to bodyweight), level curve, rank titles                           |
| `progression.ts` | Workout rating and player rating (Elo-style), EP earned/balance, unlock costs and rules |
| `calibration.ts` | Onboarding ladders, baseline progress, bonus EP, starting rating                        |
| `workout.ts`     | Progress per exercise (total reps, personal best; easier variations get credit)         |
| `proficiency.ts` | Proficiency level from total reps                                                       |
| `streak.ts`      | Streak from workouts and the hobby's schedule                                           |
| `charts.ts`      | Sets per movement group per week                                                        |
| `skillTree.ts`   | Skill tree layout (rows, columns, node/edge states)                                     |

**Exercise data:** `src/main/modules/calisthenics/exercises.ts` holds the 142 exercises. Variations like incline, decline, band-assisted and explosive are modifiers on an exercise, not separate entries.

## Tech stack

| Area          | Technology                                                 |
| ------------- | ---------------------------------------------------------- |
| Desktop shell | Electron (via electron-vite)                               |
| UI            | React, TypeScript, Tailwind CSS v4, lucide-react icons     |
| Database      | SQLite (better-sqlite3), hand-written versioned migrations |
| Animation     | GSAP (planned)                                             |
| ORM           | Drizzle ORM (considered)                                   |
| External APIs | wger (exercises), Open Food Facts (food) (planned)         |

## Architecture

```
React UI (renderer)  →  preload (window.api)  →  IPC  →  main process  →  SQLite
```

- The **renderer** (React) never accesses the database or Node directly.
- The **preload** script exposes a limited, typed API on `window.api` (types in `src/shared/types.ts`).
- The **main process** handles the database, migrations, module installation and (later) file dialogs and external API calls.
- State in the UI lives in providers: `ListProvider` for tasks/hobbies, `CaliProvider` for the calisthenics module. Changes update the UI immediately and are written to SQLite in the background.

### Lists (tasks, hobbies and future list-based features)

Every list-based feature uses the same two tables:

- `lists`: id, feature, name, and the column definitions (including widths) as JSON
- `items`: id, list, title, date, done, repeat weekdays, plus a JSON `data` field for feature-specific values

To add a new list-based feature, add a template to `src/main/templates.ts` (id, feature, name, columns). Column types are `text`, `date`, `select` and `repeat`. It's seeded on the next start.

### Add-on modules

A main-process module (`src/main/modules/<name>/`) is defined as:

```ts
type MainModule = {
  id: string
  migrations: (() => void)[]
  seed?: () => void
  registerIpc: () => void
}
```

Register it in `src/main/modules/index.ts`. Its migrations run (tracked by its own version in the `settings` table) and its seed runs when the module is enabled and on each start afterwards. The renderer side lives in `src/renderer/src/modules/<name>/` and is lazy-loaded from `App.tsx`.

## Project structure

```
src/
  shared/              # Types and date helpers used by main, preload and renderer
  main/
    db.ts              # Database, core migrations, lists/items, settings
    templates.ts       # List templates (tasks, hobbies)
    ipc.ts             # Core IPC handlers
    modules/           # Add-on modules (calisthenics, metrics)
  preload/             # Bridge exposing window.api to the UI
  renderer/src/
    components/        # Rail, Dashboard, Page, Calendar, Rows, Settings
    context/           # ListProvider + useList
    modules/           # Lazy-loaded add-on UIs (calisthenics, metrics)
    utils/             # Calisthenics formulas, streak, chart and skill tree helpers
    assets/main.css    # Tailwind setup, theme and chart series variables
    theme.ts           # Theme list + useTheme
    features.ts        # Feature names, icons, colors
```

## Getting started

```bash
# install dependencies
npm install

# run in development (opens the app window with hot reload)
npm run dev

# checks
npm run typecheck
npm run lint

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

- The database is stored in the app's user data folder (`app.getPath('userData')/app.sqlite`, on Windows `%APPDATA%\daymark\app.sqlite`).
- Core schema changes are tracked with `PRAGMA user_version`; each add-on module tracks its own version in the `settings` table.
- Changing a list template's columns doesn't update lists that already exist. Use a migration, or delete `app.sqlite` during development.
- **Export** (Settings → Data) uses SQLite's backup API, so it's safe while the app is running. With "Include body metrics" off, the `metrics_entries` table is dropped from the copy and vacuumed. Code: `src/main/backup.ts`.
- **Import** checks file integrity (`PRAGMA integrity_check`), that it is a Daymark database and that its core and module schema versions aren't newer than the app. It saves the current database to `userData/backups/before-import-<time>.sqlite`, swaps the backup in, reopens it and runs any needed migrations. No restart needed.

## Privacy

- All personal data stays on the user's device.
- Exported backups contain personal data, so users should store them safely.
- Only general queries (e.g. an exercise or food search) are sent to external APIs.

## Roadmap

1. [x] Electron + React setup
2. [x] SQLite with tasks working end to end
3. [x] Schema migrations
4. [x] Hobbies
5. [x] Themes and app shell (rail, dashboard, settings)
6. [x] Calisthenics module: logging, routines, library, history, status screen
7. [x] Calisthenics: exercise database, stat formulas, calibration, EP unlocks, rating, streak, skill tree
8. [x] Export / import
9. [x] Body metrics module
10. [ ] External API integration (exercises, food)
11. [ ] Optional: database encryption (SQLCipher)

## License

TBD
