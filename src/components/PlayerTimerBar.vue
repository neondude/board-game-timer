<script setup>
import { computed } from "vue";
import { UserRound } from "@lucide/vue";
import { formatDuration, progressPercent, TIMER_MODES } from "@/utils/timer";

const props = defineProps({ player: Object, settings: Object, countUpMaximum: Number });
defineEmits(["toggle"]);

const maximum = computed(() => {
  if (props.settings.mode === TIMER_MODES.COUNT_DOWN) return props.settings.totalDurationMs;
  if (props.settings.mode === TIMER_MODES.PER_TURN) return props.settings.turnDurationMs;
  return props.countUpMaximum || 1;
});
const progress = computed(() => progressPercent(props.player.displayTimeMs, maximum.value));
</script>

<template>
  <button class="timer-bar" :class="{ active: player.isActive, expired: player.displayTimeMs < 0 }" :style="{ '--player-color': player.color, '--progress': `${progress}%` }" type="button" @click="$emit('toggle', player.id)">
    <span class="timer-progress" aria-hidden="true"></span>
    <span class="player-identity"><UserRound /><strong>{{ player.name }}</strong></span>
    <span v-if="settings.showNumbers" class="timer-number">{{ formatDuration(player.displayTimeMs) }}</span>
    <span class="timer-state">{{ player.isActive ? 'Running' : player.displayTimeMs < 0 ? 'Over time' : 'Tap to start' }}</span>
  </button>
</template>