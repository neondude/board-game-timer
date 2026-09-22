import "fake-indexeddb/auto";
import { reactive } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import {
  createGame,
  db,
  deleteGame,
  getActiveGame,
  getGame,
  getGameHistory,
  saveGame,
} from "@/db";
import { MINUTE_MS, TIMER_MODES } from "@/utils/timer";

const settings = {
  mode: TIMER_MODES.COUNT_DOWN,
  totalDurationMs: 10 * MINUTE_MS,
  turnDurationMs: 2 * MINUTE_MS,
  carryOver: false,
  simultaneous: false,
  showNumbers: true,
};

afterEach(() => db.games.clear());

describe("game repository", () => {
  it("creates, recovers, archives, lists, and deletes a game", async () => {
    const created = await createGame(
      reactive(settings),
      [{ name: "  Player 1  ", color: "#e85d4a" }],
      1_000,
    );

    expect(created.players[0]).toMatchObject({ name: "Player 1", timeMs: 600_000 });
    expect(created.settings).toEqual(settings);
    expect((await getActiveGame()).id).toBe(created.id);

    await saveGame({
      ...(await getGame(created.id)),
      status: "complete",
      endedAt: 5_000,
      updatedAt: 5_000,
    });

    expect(await getActiveGame()).toBeUndefined();
    expect(await getGameHistory()).toHaveLength(1);
    await deleteGame(created.id);
    expect(await getGame(created.id)).toBeUndefined();
  });
});