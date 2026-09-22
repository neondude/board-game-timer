<script setup>
import { formatDuration } from "@/utils/timer";
defineProps({ elapsedMs: Number, turnCount: Number });
defineEmits(["resume", "end"]);
</script>

<template>
  <div class="pause-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title">
    <p class="eyebrow">Game paused</p>
    <h2 id="pause-title">Take a breath.</h2>
    <div class="pause-stats">
      <div><span>Game time</span><strong>{{ formatDuration(elapsedMs) }}</strong></div>
      <div><span>Turns</span><strong>{{ turnCount }}</strong></div>
    </div>
    <button class="primary-action" type="button" @click="$emit('resume')">Resume game</button>
    <button class="text-action danger" type="button" @click="$emit('end')">End and save game</button>
  </div>
</template>