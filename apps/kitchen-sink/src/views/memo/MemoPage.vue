<script setup lang="ts">
import { useMemoStore } from "@/stores/memos";
import MemoList from "./MemoList.vue";
import MemoEditor from "./MemoEditor.vue";
import { PageEntry } from "@/components/acrux-ui/page";
import { useFormModel } from "@/components/acrux-ui/actions";

const { useAll } = useMemoStore();
const { create } = useFormModel(MemoEditor);

const [items, status, refresh] = useAll();
</script>

<template>
  <PageEntry
    title="Memos"
    description="随手记录灵感与想法"
    :loading="status.loading"
    :error="status.error"
    :items="items"
    @retry="void refresh()"
    @create="create()"
  >
    <MemoList />
  </PageEntry>
</template>
