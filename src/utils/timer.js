export const TIMER_MODES = Object.freeze({
  COUNT_UP: "count-up",
  COUNT_DOWN: "count-down",
  PER_TURN: "per-turn",
});

export const MINUTE_MS = 60_000;

export function elapsedSince(startedAt, now = Date.now()) {
  return startedAt == null ? 0 : Math.max(0, now - startedAt);
}

export function playerTime(player, mode, now = Date.now()) {
  const liveElapsed = player.isActive ? elapsedSince(player.startedAt, now) : 0;

  if (mode === TIMER_MODES.COUNT_UP) {
    return player.timeMs + liveElapsed;
  }

  return player.timeMs - liveElapsed;
}

export function settlePlayer(player, mode, now = Date.now()) {
  return {
    ...player,
    timeMs: playerTime(player, mode, now),
    isActive: false,
    startedAt: null,
  };
}

export function beginTurn(player, settings, now = Date.now()) {
  let timeMs = player.timeMs;

  if (settings.mode === TIMER_MODES.PER_TURN) {
    timeMs = settings.carryOver
      ? player.timeMs + settings.turnDurationMs
      : settings.turnDurationMs;
  }

  return {
    ...player,
    timeMs,
    isActive: true,
    startedAt: now,
  };
}

export function gameElapsed(game, now = Date.now()) {
  if (!game.startedAt) return 0;

  const currentRun = game.isPaused ? 0 : elapsedSince(game.resumedAt, now);
  return Math.max(0, game.elapsedMs + currentRun);
}

export function progressPercent(valueMs, maximumMs) {
  if (maximumMs <= 0) return 0;
  return Math.min(100, Math.max(0, (valueMs / maximumMs) * 100));
}

export function formatDuration(valueMs) {
  const negative = valueMs < 0;
  const totalSeconds = Math.floor(Math.abs(valueMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const sign = negative ? "-" : "";

  if (hours > 0) {
    return `${sign}${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${sign}${minutes}:${String(seconds).padStart(2, "0")}`;
}