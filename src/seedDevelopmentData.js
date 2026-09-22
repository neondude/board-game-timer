import { createGame, db } from "@/db";
import { MINUTE_MS, TIMER_MODES } from "@/utils/timer";

export async function seedDevelopmentData() {
  await db.games.clear();
  await createGame(
    {
      mode: TIMER_MODES.PER_TURN,
      totalDurationMs: 10 * MINUTE_MS,
      turnDurationMs: 2 * MINUTE_MS,
      carryOver: true,
      simultaneous: false,
      showNumbers: true,
    },
    [
      { name: "Ada", color: "#e85d4a" },
      { name: "Grace", color: "#e5a832" },
      { name: "Linus", color: "#38a169" },
      { name: "Margaret", color: "#2f80c9" },
    ],
  );
}