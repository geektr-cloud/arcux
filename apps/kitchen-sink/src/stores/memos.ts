import { memo } from "@server/core/memos";
import { useHonoApi, useSortedCollection } from "@acrux/core";
import { client } from "@/utils/api";
import { defineStore } from "pinia";

export const useMemoStore = defineStore("memos", () =>
  useSortedCollection({
    newItem: memo.newItem,
    fetchFn: useHonoApi(() => client.api.memos.$get()),
    removeFn: useHonoApi((id: string) => client.api.memos[":id"].$delete({ param: { id } })),
    upsertFn: useHonoApi((json: memo.Memo) => client.api.memos.$put({ json })),
    upsertSchema: memo.upsert.body,
  }),
);
