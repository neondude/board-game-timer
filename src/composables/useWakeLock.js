import { onBeforeUnmount, ref } from "vue";

export function useWakeLock() {
  const supported = ref("wakeLock" in navigator);
  const active = ref(false);
  let sentinel = null;

  async function request() {
    if (!supported.value || active.value || document.visibilityState !== "visible") return;
    try {
      sentinel = await navigator.wakeLock.request("screen");
      active.value = true;
      sentinel.addEventListener("release", () => { active.value = false; });
    } catch {
      active.value = false;
    }
  }

  async function release() {
    await sentinel?.release();
    sentinel = null;
    active.value = false;
  }

  const onVisibility = () => {
    if (document.visibilityState === "visible" && !active.value) request();
  };
  document.addEventListener("visibilitychange", onVisibility);
  onBeforeUnmount(() => {
    document.removeEventListener("visibilitychange", onVisibility);
    release();
  });

  return { supported, active, request, release };
}