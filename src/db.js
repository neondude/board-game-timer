import Dexie from "dexie";
import { TIMER_MODES } from "@/utils/timer";

export const db = new Dexie("board-game-timer");

db.version(1).stores({
  games: "id, status, updatedAt, endedAt",
});

export function initialPlayerTime(settings) {
  if (settings.mode === TIMER_MODES.COUNT_DOWN) return settings.totalDurationMs;
  return 0;
}

export async function createGame(settings, players, now = Date.now()) {
  const settingsSnapshot = {
    mode: settings.mode,
    totalDurationMs: settings.totalDurationMs,
    turnDurationMs: settings.turnDurationMs,
    carryOver: settings.carryOver,
    simultaneous: settings.simultaneous,
    showNumbers: settings.showNumbers,
  };
  const game = {
    id: crypto.randomUUID(),
    status: "active",
    createdAt: now,
    updatedAt: now,
    endedAt: null,
    startedAt: now,
    resumedAt: now,
    elapsedMs: 0,
    isPaused: false,
    suspendedPlayerIds: [],
    turnCount: 0,
    settings: settingsSnapshot,
    players: players.map((player, index) => ({
      id: player.id || crypto.randomUUID(),
      name: player.name.trim(),
      color: player.color,
      order: index,
      timeMs: initialPlayerTime(settings),
      isActive: false,
      startedAt: null,
    })),
  };

  await db.games.add(game);
  return game;
}

export function getGame(id) {
  return db.games.get(id);
}

export function getActiveGame() {
  return db.games.where("status").equals("active").last();
}

export function getGameHistory() {
  return db.games.where("status").equals("complete").reverse().sortBy("endedAt");
}

export function saveGame(game) {
  return db.games.put(game);
}

export function deleteGame(id) {
  return db.games.delete(id);
}