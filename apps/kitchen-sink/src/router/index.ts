import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "../views/auth/LoginPage.vue";
import MemoPage from "../views/memo/MemoPage.vue";
import MemoDetailPage from "../views/memo/MemoDetailPage.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginPage,
      meta: { public: true },
    },
    {
      path: "/",
      name: "home",
      component: MemoPage,
    },
    {
      path: "/memos/:id",
      name: "memo-detail",
      component: MemoDetailPage,
    },
  ],
});

router.beforeEach(async (to) => {
  if (to.meta.public) return true;
  const { useAuthStore } = await import("@/stores/auth");
  const auth = useAuthStore();
  if (!auth.ready) await auth.check();
  if (!auth.authenticated) {
    return { name: "login", query: { next: to.fullPath } };
  }
  return true;
});

export default router;
