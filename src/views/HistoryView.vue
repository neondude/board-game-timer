<script setup>
import { ArrowLeft, RotateCcw, Trash2 } from "@lucide/vue";
import { useRouter } from "vue-router";
import { useGameHistory } from "@/composables/useGameTimer";
import { formatDuration } from "@/utils/timer";

const router = useRouter();
const { games, deleteGame } = useGameHistory();

function replay(game) {
  sessionStorage.setItem("quickturn-replay", JSON.stringify({ settings: game.settings, players: game.players }));
  router.push("/");
}
</script>

<template>
  <main class="history-page">
    <header class="page-header"><RouterLink class="icon-button" to="/" title="Back to setup"><ArrowLeft /></RouterLink><div><p class="eyebrow">Saved locally</p><h1>Game history</h1></div></header>
    <div v-if="!games.length" class="empty-state"><strong>No finished games yet.</strong><p>Your completed clocks will stay here on this device.</p></div>
    <article v-for="game in games" :key="game.id" class="history-item">
      <header><div><strong>{{ new Date(game.endedAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) }}</strong><span>{{ game.settings.mode.replace('-', ' ') }} · {{ formatDuration(game.elapsedMs) }} · {{ game.turnCount }} turns</span></div><div class="history-actions"><button class="icon-button small" type="button" title="Use this setup" @click="replay(game)"><RotateCcw /></button><button class="icon-button small" type="button" title="Delete game" @click="deleteGame(game.id)"><Trash2 /></button></div></header>
      <div class="history-players"><div v-for="player in game.players" :key="player.id"><i :style="{ background: player.color }"></i><span>{{ player.name }}</span><strong>{{ formatDuration(player.timeMs) }}</strong></div></div>
    </article>
  </main>
</template>