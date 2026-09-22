import { computed, onBeforeUnmount, ref } from "vue";
import { liveQuery } from "dexie";
import { useObservable } from "@vueuse/rxjs";
import { createGame, db, deleteGame, getGame, saveGame } from "@/db";
import {
  beginTurn,
  gameElapsed,
  playerTime,
  settlePlayer,
} from "@/utils/timer";

function settleActivePlayers(game, now) {
  return game.players.map((player) =>
    player.isActive ? settlePlayer(player, game.settings.mode, now) : player,
  );
}

export function useGameTimer(gameId) {
  const now = ref(Date.now());
  const game = useObservable(
    liveQuery(() => (gameId ? getGame(gameId) : Promise.resolve(null))),
    { initialValue: null },
  );
  let animationFrame;

  const tick = () => {
    now.value = Date.now();
    animationFrame = requestAnimationFrame(tick);
  };

  animationFrame = requestAnimationFrame(tick);
  onBeforeUnmount(() => cancelAnimationFrame(animationFrame));

  const players = computed(() => {
    if (!game.value) return [];
    return game.value.players
      .map((player) => ({
        ...player,
        displayTimeMs: playerTime(player, game.value.settings.mode, now.value),
      }))
      .sort((left, right) => left.order - right.order);
  });

  const elapsedMs = computed(() => gameElapsed(game.value || {}, now.value));

  async function togglePlayer(playerId, at = Date.now()) {
    await db.transaction("rw", db.games, async () => {
      const current = await getGame(gameId);
      if (!current || current.status !== "active" || current.isPaused) return;

      const wasActive = current.players.some(
        (player) => player.id === playerId && player.isActive,
      );
      let nextPlayers = current.settings.simultaneous
        ? current.players.map((player) =>
            player.id === playerId && player.isActive
              ? settlePlayer(player, current.settings.mode, at)
              : player,
          )
        : settleActivePlayers(current, at);

      if (!wasActive) {
        nextPlayers = nextPlayers.map((player) =>
          player.id === playerId
            ? beginTurn(player, current.settings, at)
            : player,
        );
      }

      await saveGame({
        ...current,
        players: nextPlayers,
        turnCount: current.turnCount + (wasActive ? 0 : 1),
        updatedAt: at,
      });
    });
  }

  async function pause(at = Date.now()) {
    await db.transaction("rw", db.games, async () => {
      const current = await getGame(gameId);
      if (!current || current.isPaused || current.status !== "active") return;

      await saveGame({
        ...current,
        players: settleActivePlayers(current, at),
        suspendedPlayerIds: current.players
          .filter((player) => player.isActive)
          .map((player) => player.id),
        elapsedMs: gameElapsed(current, at),
        resumedAt: null,
        isPaused: true,
        updatedAt: at,
      });
    });
  }

  async function resume(at = Date.now()) {
    await db.transaction("rw", db.games, async () => {
      const current = await getGame(gameId);
      if (!current || !current.isPaused || current.status !== "active") return;
      const suspended = new Set(current.suspendedPlayerIds);

      await saveGame({
        ...current,
        players: current.players.map((player) =>
          suspended.has(player.id)
            ? { ...player, isActive: true, startedAt: at }
            : player,
        ),
        suspendedPlayerIds: [],
        resumedAt: at,
        isPaused: false,
        updatedAt: at,
      });
    });
  }

  async function endGame(at = Date.now()) {
    await db.transaction("rw", db.games, async () => {
      const current = await getGame(gameId);
      if (!current || current.status !== "active") return;

      await saveGame({
        ...current,
        players: settleActivePlayers(current, at),
        elapsedMs: gameElapsed(current, at),
        resumedAt: null,
        isPaused: true,
        suspendedPlayerIds: [],
        status: "complete",
        endedAt: at,
        updatedAt: at,
      });
    });
  }

  return { game, players, now, elapsedMs, togglePlayer, pause, resume, endGame };
}

export function useGameHistory() {
  const games = useObservable(
    liveQuery(() =>
      db.games.where("status").equals("complete").reverse().sortBy("endedAt"),
    ),
    { initialValue: [] },
  );

  return { games, deleteGame };
}

export function useActiveGame() {
  const game = useObservable(
    liveQuery(() => db.games.where("status").equals("active").last()),
    { initialValue: null },
  );
  return { game };
}

export { createGame };