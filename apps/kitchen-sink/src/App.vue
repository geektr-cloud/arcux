<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { ModalsContainer } from "vue-final-modal";
import { LogOut } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const navLinkClass = (active: boolean) =>
  ["no-underline transition-colors", active ? "text-cyan-400" : "text-zinc-400 hover:text-cyan-400"].join(" ");
const memosActive = computed(() => route.name === "home" || route.name === "memo-detail");

const onLogout = async () => {
  await auth.logout();
  router.push("/login");
};
</script>

<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100">
    <ModalsContainer />
    <header
      v-if="auth.authenticated"
      class="sticky top-0 z-10 flex h-14 items-center gap-6 border-b border-zinc-800/80 bg-zinc-950/95 px-4 backdrop-blur supports-backdrop-filter:bg-zinc-950/80"
    >
      <RouterLink
        to="/"
        class="text-lg font-semibold tracking-tight text-zinc-100 no-underline transition-colors hover:text-cyan-400"
      >
        Memos
      </RouterLink>
      <nav class="flex items-center gap-4 text-sm">
        <RouterLink to="/" :class="navLinkClass(memosActive)"> Memos </RouterLink>
      </nav>
      <div class="ml-auto">
        <Button
          v-if="auth.authenticated && route.name !== 'login'"
          variant="ghost"
          size="icon"
          title="登出"
          @click="onLogout"
        >
          <LogOut />
        </Button>
      </div>
    </header>
    <main class="bg-zinc-950">
      <RouterView v-if="auth.authenticated || route.name === 'login'" />
    </main>
  </div>
</template>
