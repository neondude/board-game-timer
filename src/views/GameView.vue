<script setup>
import { computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { Expand, History, LockKeyhole, Pause, Shrink } from "@lucide/vue";
import PlayerTimerBar from "@/components/PlayerTimerBar.vue";
import GamePauseOverlay from "@/components/GamePauseOverlay.vue";
import { useGameTimer } from "@/composables/useGameTimer";
import { useFullscreen } from "@/composables/useFullscreen";
import { useWakeLock } from "@/composables/useWakeLock";

const props = defineProps({ id: String });
const router = useRouter();
const { game, players, elapsedMs, togglePlayer, pause, resume, endGame } = useGameTimer(props.id);
const { isFullscreen, supported: fullscreenSupported, toggleFullscreen } = useFullscreen();
const wakeLock = useWakeLock();
const countUpMaximum = computed(() => Math.max(1, ...players.value.map((player) => player.displayTimeMs)));

onMounted(() => wakeLock.request());
watch(game, (value) => {
  if (value && value.status !== "active") router.replace("/history");
});
watch(
  () => game.value?.isPaused,
  (isPaused) => {
    if (isPaused) wakeLock.release();
    else if (game.value) wakeLock.request();
  },
);

async function finishGame() {
  if (!window.confirm("End this game and save the results?")) return;
  await endGame();
  await wakeLock.release();
  router.replace("/history");
}
</script>

<template>
  <main v-if="game" class="game-page">
    <header class="game-toolbar">
      <div><span>Turn {{ game.turnCount }}</span><strong>{{ game.settings.simultaneous ? 'Open turns' : 'Table order' }}</strong></div>
      <nav>
        <span class="wake-status" :title="wakeLock.supported.value ? 'Screen wake lock' : 'Wake lock unavailable'"><LockKeyhole :class="{ active: wakeLock.active.value }" /></span>
        <button v-if="fullscreenSupported" class="icon-button inverse" type="button" title="Toggle fullscreen" @click="toggleFullscreen"><Shrink v-if="isFullscreen" /><Expand v-else /></button>
        <RouterLink class="icon-button inverse" to="/history" title="Game history"><History /></RouterLink>
        <button class="icon-button inverse" type="button" title="Pause game" @click="pause()"><Pause /></button>
      </nav>
    </header>
    <section class="timer-grid" :class="`players-${players.length}`">
      <PlayerTimerBar v-for="player in players" :key="player.id" :player="player" :settings="game.settings" :count-up-maximum="countUpMaximum" @toggle="togglePlayer" />
    </section>
    <GamePauseOverlay v-if="game.isPaused" :elapsed-ms="elapsedMs" :turn-count="game.turnCount" @resume="resume" @end="finishGame" />
  </main>
  <main v-else class="loading-page"><p>Loading game...</p><RouterLink to="/">Return to setup</RouterLink></main>
</template>