import { describe, expect, it } from "vitest";
import {
  TIMER_MODES,
  beginTurn,
  formatDuration,
  gameElapsed,
  playerTime,
  progressPercent,
  settlePlayer,
} from "@/utils/timer";

const player = {
  id: "player-1",
  timeMs: 60_000,
  isActive: false,
  startedAt: null,
};

describe("timer domain", () => {
  it("derives count-up and signed countdown values from wall-clock anchors", () => {
    const active = { ...player, isActive: true, startedAt: 1_000 };

    expect(playerTime(active, TIMER_MODES.COUNT_UP, 11_000)).toBe(70_000);
    expect(playerTime(active, TIMER_MODES.COUNT_DOWN, 71_000)).toBe(-10_000);
    expect(settlePlayer(active, TIMER_MODES.COUNT_DOWN, 71_000)).toMatchObject({
      timeMs: -10_000,
      isActive: false,
      startedAt: null,
    });
  });

  it("resets fixed turns and carries signed balances when enabled", () => {
    expect(
      beginTurn(player, {
        mode: TIMER_MODES.PER_TURN,
        turnDurationMs: 120_000,
        carryOver: false,
      }, 5_000).timeMs,
    ).toBe(120_000);

    expect(
      beginTurn({ ...player, timeMs: -30_000 }, {
        mode: TIMER_MODES.PER_TURN,
        turnDurationMs: 120_000,
        carryOver: true,
      }, 5_000).timeMs,
    ).toBe(90_000);
  });

  it("excludes paused time from game elapsed time", () => {
    expect(gameElapsed({ startedAt: 1_000, resumedAt: 6_000, elapsedMs: 20_000, isPaused: false }, 16_000)).toBe(30_000);
    expect(gameElapsed({ startedAt: 1_000, resumedAt: null, elapsedMs: 20_000, isPaused: true }, 99_000)).toBe(20_000);
  });

  it("formats signed durations and clamps progress only", () => {
    expect(formatDuration(-65_000)).toBe("-1:05");
    expect(formatDuration(3_661_000)).toBe("1:01:01");
    expect(progressPercent(-5_000, 60_000)).toBe(0);
    expect(progressPercent(90_000, 60_000)).toBe(100);
  });
});