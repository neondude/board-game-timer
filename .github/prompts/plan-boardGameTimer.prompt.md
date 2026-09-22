## Plan: Build Board Game Timer

Replace the Vue demo with a single-device, mobile/tablet-first board-game clock. Use a small explicit timer state machine, persist event snapshots in Dexie instead of timer ticks, and provide setup, active-game recovery, pause/end, and completed-game history. Per-turn timing defaults to a fixed reset and exposes the agreed carry-over toggle, where each new turn adds the allowance to the player's existing positive or negative balance.

**Steps**

### Phase 1: Domain and persistence
1. Replace the counter schema with a versioned Dexie model centered on a `games` table indexed by status/update/end timestamps. Store each game's setup, ordered players, timer snapshots, active player IDs, turn count, accumulated game time, active timing anchors, and lifecycle status in one atomic game record; retain completed records as history and query the latest `active` record for reload recovery. Rename the database for the product, while keeping the old v1 declaration available for a clean Dexie migration/removal of obsolete counters.
2. Add timer-domain constants and pure calculations for formatting signed durations, deriving live elapsed time from persisted `Date.now()` anchors, clamping only progress percentages (never timer values), computing game elapsed time excluding explicit pauses, and applying mode transitions:
   - Count Up: display accumulated elapsed time with no terminal limit.
   - Count Down: start from the selected 5/10/15/20-minute total and continue below zero if overspent.
   - Time Per Turn, fixed: reset that player's turn balance to the configured allowance (default 2:00) on each new activation.
   - Time Per Turn, carry-over: add the allowance to the player's current signed balance on each new activation, then drain it, preserving both unused and negative time.
   Resume must restore paused active players without adding another allowance or incrementing the turn count.
3. Build a `useGameTimer` composable as the only mutation boundary. It should create/start a game, atomically switch players in sequential mode, independently toggle players in simultaneous mode, pause/resume all active timers, end/archive a game, recover the active game through `liveQuery`, and delete history entries. Use one `requestAnimationFrame` display clock plus wall-clock anchors so backgrounding/reloads remain accurate without IndexedDB writes per frame. A refresh or app closure while unpaused intentionally lets active clocks continue until the user explicitly pauses.

### Phase 2: Product UI
4. Replace router/demo shell with three focused routes: setup at `/`, active timer at `/game/:id`, and history at `/history`. Add guards/fallbacks so a saved active game can be resumed from setup and an invalid/completed game route returns safely. Remove the About/counter demo and its obsolete tests/composable.
5. Build the setup screen for 1-8 players: compact editable player rows with unique selectable color swatches, add/remove controls, touch-capable drag handles, and live ordering; segmented timing-mode controls; total-time presets (5/10/15/20 minutes); configurable per-turn minutes/seconds defaulting to 2:00; the per-turn carry-over toggle; simultaneous-turn toggle; numeric-display toggle; and a prominent Start Game action. Validate non-empty names, unique colors, player bounds, and positive configured durations before creating the persisted game.
6. Build the active timer as the primary full-screen experience: a responsive stack/grid of large color-coded player bars with a meeple/person icon, player name, stable progress track, active state, and optional large signed `MM:SS`/`H:MM:SS` value. In sequential mode, tapping a player atomically stops the current player and starts the tapped player; tapping the active player stops it. In simultaneous mode, each bar toggles independently. Normalize Count Up bars relative to the largest current player elapsed value; normalize limited modes against their configured allowance and visually flag zero/negative time without hiding overspend.
7. Add a restrained icon toolbar for pause, fullscreen, wake-lock status, and overflow/history actions. Pause opens a full-screen overlay showing active game time and `Turn N`, with Resume and End Game; End confirms, commits all running time, archives the summary, releases wake lock, and routes to history. History lists completed games with date, duration, mode, turns, and per-player totals/balances, with replay-setup and delete actions but no full event-by-event log.
8. Add browser integrations: request/release Fullscreen API with vendor-safe capability checks; request Screen Wake Lock while an unpaused game is open, reacquire it after visibility returns, and expose a quiet unavailable/released state instead of promising support on unsupported iOS browsers. Configure `vite-plugin-pwa` metadata/theme and installability for an offline-capable timer shell.

### Phase 3: Visual system and quality
9. Replace boilerplate CSS/Bootstrap-demo styling with a purpose-built responsive visual system: warm neutral game-table background, high-contrast multi-color player palette, expressive condensed display typography plus readable UI typography, large tap targets, 8px-or-less radii, no nested cards, and stable bar dimensions from phones through landscape tablets. Use Lucide icons in controls and a touch-compatible Vue draggable integration; include visible focus states, non-color active/expired cues, reduced-motion support, safe-area insets, and no text overlap at eight-player density.
10. Add focused tests in dependency order: pure fake-clock tests for all mode calculations, signed carry-over, switching, simultaneous activation, pause/resume, and reload anchors; fake IndexedDB tests for create/recover/archive/delete flows; component tests for setup validation, player interactions, numeric-display preference, and pause/end behavior. Replace the existing DemoCounter test rather than preserving boilerplate coverage.

**Relevant files**
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/package.json` — rename package and add Lucide, touch drag/reorder, and fake IndexedDB test dependencies.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/vite.config.js` — configure PWA manifest, theme, and offline shell behavior.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/index.html` — product title, viewport/safe-area, theme, and install metadata.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/db.js` — versioned `games` schema and active/history queries.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/composables/useGameTimer.js` — timer state machine, persistence boundary, and live view model.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/composables/useFullscreen.js` — Fullscreen API state and actions.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/composables/useWakeLock.js` — wake-lock lifecycle and fallback state.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/utils/timer.js` — pure mode, duration, progress, and formatting calculations.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/router/index.js` — setup, game, and history routes plus recovery behavior.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/App.vue` — minimal app shell and route outlet.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/views/HomeView.vue` — replace with the setup experience, or rename to `SetupView.vue` and update routing.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/views/GameView.vue` — active clocks, toolbar, and pause/end overlay.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/views/HistoryView.vue` — completed-game summaries and deletion/replay actions.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/components/PlayerSetupList.vue` — player editing, swatches, and drag ordering.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/components/PlayerTimerBar.vue` — stable colored timer/progress interaction surface.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/components/GamePauseOverlay.vue` — game-time/turn indicator and resume/end flow.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/assets/base.css` and `src/assets/main.css` — reset, tokens, responsive layout, type, motion, and accessibility states.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/seedDevelopmentData.js` — seed representative active/completed games or remove the demo seeding path if no longer useful.
- `c:/DDrive/my_projects/personal/board-game-timer/board-game-timer/src/views/AboutView.vue`, `src/components/DemoCounter.vue`, `src/composables/useCounter.js`, and `src/components/__tests__/DemoCounter.spec.js` — delete obsolete boilerplate.

**Verification**
1. Run `npm run test:unit -- --run` with deterministic fake timers and fake IndexedDB; verify fixed per-turn reset, positive and negative carry-over, simultaneous clocks, sequential switching, pause exclusion, reload recovery, and archive deletion.
2. Run `npm run build` and confirm the PWA build completes without manifest or service-worker errors.
3. Run the Vite development server and manually exercise 1-player and 8-player setups, all three timing modes, 5/10/15/20-minute presets, numeric display on/off, drag reorder on touch and pointer input, sequential and simultaneous interactions, pause/resume, end/history, refresh recovery, and negative values.
4. Check narrow phone portrait, phone landscape, and tablet viewports for eight-player fit, safe-area spacing, focus visibility, color-independent states, and no layout shifts or overlaps.
5. Test fullscreen and wake lock in a supported Chromium browser, including visibility loss/reacquisition; verify unsupported APIs degrade to a clear passive status and do not block timing.
6. Install or run the production PWA offline and confirm the shell opens, the saved active game/history load from IndexedDB, and active timestamp-based clocks reconcile correctly.

**Decisions**
- Player count is 1-8, per the user's selection; supporting more than eight is out of scope.
- Sequential play uses direct player taps, not a forced Next button. Player ordering still controls visual order and saved history.
- Per-turn mode defaults to fixed 2:00 resets and offers the agreed carry-over toggle; carry-over adds an allowance each activation and preserves signed balances.
- IndexedDB stores active-game recovery and completed history. Reusable setup presets and granular turn-event history are excluded.
- Game time excludes explicit pauses. `Turn N` counts fresh player activations; simultaneous activations each count as a turn, while resume does not.
- Timers continue across refresh/background/app closure unless explicitly paused, matching timestamp-based clock semantics.
- No network synchronization, accounts, cloud backup, sounds, tournament rules, or automatic next-player behavior are included.
