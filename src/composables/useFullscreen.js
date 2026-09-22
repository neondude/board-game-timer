import { computed, onBeforeUnmount, ref } from "vue";

export function useFullscreen() {
  const isFullscreen = ref(Boolean(document.fullscreenElement));
  const supported = computed(() => Boolean(document.documentElement.requestFullscreen));
  const onChange = () => { isFullscreen.value = Boolean(document.fullscreenElement); };
  document.addEventListener("fullscreenchange", onChange);
  onBeforeUnmount(() => document.removeEventListener("fullscreenchange", onChange));

  async function toggleFullscreen() {
    if (!supported.value) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }

  return { isFullscreen, supported, toggleFullscreen };
}