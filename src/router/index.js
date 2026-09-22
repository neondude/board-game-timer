import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_PATH || "/"),
  routes: [
    {
      path: "/",
      name: "setup",
      component: HomeView,
    },
    {
      path: "/game/:id",
      name: "game",
      component: () => import("@/views/GameView.vue"),
      props: true,
    },
    {
      path: "/history",
      name: "history",
      component: () => import("@/views/HistoryView.vue"),
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

export default router;
