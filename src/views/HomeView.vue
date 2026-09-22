<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import draggable from "vuedraggable";
import { GripVertical, History, Plus, Trash2 } from "@lucide/vue";
import { createGame, useActiveGame } from "@/composables/useGameTimer";
import { MINUTE_MS, TIMER_MODES } from "@/utils/timer";

const router = useRouter();
const { game: activeGame } = useActiveGame();
const colors = ["#e85d4a", "#e5a832", "#38a169", "#2f80c9", "#7356b5", "#d85b9f", "#24a5a5", "#59636d"];
let playerNumber = 2;

const players = ref([
  { id: crypto.randomUUID(), name: "Player 1", color: colors[0] },
  { id: crypto.randomUUID(), name: "Player 2", color: colors[1] },
]);
const settings = ref({
  mode: TIMER_MODES.PER_TURN,
  totalDurationMs: 10 * MINUTE_MS,
  turnDurationMs: 2 * MINUTE_MS,
  carryOver: false,
  simultaneous: false,
  showNumbers: true,
});
const error = ref("");

const replaySetup = sessionStorage.getItem("quickturn-replay");
if (replaySetup) {
  try {
    const replay = JSON.parse(replaySetup);
    settings.value = replay.settings;
    players.value = replay.players.map(({ name, color }) => ({
      id: crypto.randomUUID(),
      name,
      color,
    }));
    playerNumber = players.value.length;
  } finally {
    sessionStorage.removeItem("quickturn-replay");
  }
}

const usedColors = computed(() => new Set(players.value.map((player) => player.color)));

function addPlayer() {
  if (players.value.length >= 8) return;
  playerNumber += 1;
  const color = colors.find((candidate) => !usedColors.value.has(candidate)) || colors[0];
  players.value.push({ id: crypto.randomUUID(), name: `Player ${playerNumber}`, color });
}

function removePlayer(index) {
  if (players.value.length > 1) players.value.splice(index, 1);
}

async function startGame() {
  if (activeGame.value) {
    error.value = "Resume or finish the active game before starting another.";
    return;
  }
  const names = players.value.map((player) => player.name.trim());
  const uniqueColors = new Set(players.value.map((player) => player.color));
  if (names.some((name) => !name)) {
    error.value = "Every player needs a name.";
    return;
  }
  if (uniqueColors.size !== players.value.length) {
    error.value = "Give each player a different color.";
    return;
  }
  if (settings.value.mode === TIMER_MODES.PER_TURN && settings.value.turnDurationMs <= 0) {
    error.value = "Turn time must be greater than zero.";
    return;
  }

  const game = await createGame(settings.value, players.value);
  router.push({ name: "game", params: { id: game.id } });
}
</script>

<template>
  <main class="setup-page">
    <header class="setup-header">
      <div>
        <p class="eyebrow">Board game clock</p>
        <h1>QuickTurn</h1>
        <p class="tagline">Speed up snail pacing board games.</p>
      </div>
      <RouterLink class="icon-button" to="/history" title="Game history" aria-label="Game history"><History /></RouterLink>
    </header>

    <button v-if="activeGame" class="resume-banner" type="button" @click="router.push(`/game/${activeGame.id}`)">
      A game is already in progress <strong>Resume game</strong>
    </button>

    <section class="setup-section">
      <div class="section-heading">
        <div><span>01</span><h2>Players</h2></div>
        <button class="icon-button" type="button" :disabled="players.length >= 8" title="Add player" @click="addPlayer"><Plus /></button>
      </div>
      <draggable v-model="players" item-key="id" handle=".drag-handle" class="player-editor" ghost-class="drag-ghost">
        <template #item="{ element: player, index }">
          <div class="player-edit-row">
            <button class="drag-handle" type="button" aria-label="Reorder player"><GripVertical /></button>
            <label class="color-swatch" :style="{ background: player.color }">
              <span class="sr-only">Player color</span>
              <select v-model="player.color" aria-label="Player color">
                <option v-for="color in colors" :key="color" :value="color">{{ color }}</option>
              </select>
            </label>
            <input v-model="player.name" maxlength="24" :aria-label="`Player ${index + 1} name`" />
            <button class="icon-button small" type="button" :disabled="players.length === 1" title="Remove player" @click="removePlayer(index)"><Trash2 /></button>
          </div>
        </template>
      </draggable>
      <p class="field-note">Drag to set table order. Up to 8 players.</p>
    </section>

    <section class="setup-section">
      <div class="section-heading"><div><span>02</span><h2>Clock</h2></div></div>
      <div class="segmented" aria-label="Timer mode">
        <button type="button" :class="{ selected: settings.mode === TIMER_MODES.COUNT_UP }" @click="settings.mode = TIMER_MODES.COUNT_UP">Count up</button>
        <button type="button" :class="{ selected: settings.mode === TIMER_MODES.COUNT_DOWN }" @click="settings.mode = TIMER_MODES.COUNT_DOWN">Total time</button>
        <button type="button" :class="{ selected: settings.mode === TIMER_MODES.PER_TURN }" @click="settings.mode = TIMER_MODES.PER_TURN">Per turn</button>
      </div>

      <div v-if="settings.mode === TIMER_MODES.COUNT_DOWN" class="option-block">
        <label>Total per player</label>
        <div class="time-presets">
          <button v-for="minutes in [5, 10, 15, 20]" :key="minutes" type="button" :class="{ selected: settings.totalDurationMs === minutes * MINUTE_MS }" @click="settings.totalDurationMs = minutes * MINUTE_MS">{{ minutes }} min</button>
        </div>
      </div>

      <div v-if="settings.mode === TIMER_MODES.PER_TURN" class="option-block split-option">
        <label>Turn allowance</label>
        <input v-model.number="settings.turnDurationMs" type="range" :min="30 * 1000" :max="10 * MINUTE_MS" :step="30 * 1000" />
        <strong>{{ settings.turnDurationMs / MINUTE_MS }} min</strong>
      </div>

      <label v-if="settings.mode === TIMER_MODES.PER_TURN" class="toggle-row">
        <input v-model="settings.carryOver" type="checkbox" />
        <span><strong>Carry time between turns</strong><small>Unused and overspent time both roll forward.</small></span>
      </label>
      <label class="toggle-row">
        <input v-model="settings.simultaneous" type="checkbox" />
        <span><strong>Simultaneous turns</strong><small>More than one player can run at once.</small></span>
      </label>
      <label class="toggle-row">
        <input v-model="settings.showNumbers" type="checkbox" />
        <span><strong>Show exact time</strong><small>Display numbers alongside the color bar.</small></span>
      </label>
    </section>

    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <button class="primary-action" type="button" @click="startGame">Start game</button>
  </main>
</template>
