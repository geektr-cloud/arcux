import { type AsyncState, useAsyncState } from "./async";
import { useValidation } from "./issues";
import { useClonedReactive } from "./utils";
import type { BaseData, BaseId, Removal, Upsert } from "./base";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { type Ref, computed } from "vue";

export type SortedCollectionOptions<T extends BaseData, VariantT extends T = T> = {
  newItem: () => T;
  fetchFn: () => Promise<VariantT[]>;
  sortFn?: (a: VariantT, b: VariantT) => number;
  resolveFn?: (item: T) => Promise<VariantT>;
  removeFn: (id: BaseId) => Promise<T>;
  upsertFn: (item: VariantT) => Promise<T>;
  upsertSchema: StandardSchemaV1;
};

export const useSortedCollection = <T extends BaseData, VariantT extends T = T>(
  opts: SortedCollectionOptions<T, VariantT>,
) => {
  const sortFn = opts.sortFn ?? ((a, b) => a.id.localeCompare(b.id));
  const resolveFn = opts.resolveFn ?? ((item) => item as VariantT);

  const [items, status, reload] = useAsyncState(opts.fetchFn, [], { immediate: true });
  const sorted = computed(() => items.value.sort(sortFn));

  const _upsert = async (item: VariantT) => {
    const index = items.value.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      items.value[index] = item;
    } else {
      items.value.push(item);
    }
    items.value = items.value.slice();
  };

  const _remove = (id: BaseId) => {
    const index = items.value.findIndex((i) => i.id === id);
    if (index !== -1) {
      items.value.splice(index, 1);
    }
    items.value = items.value.slice();
  };

  const useAll = (): AsyncState<VariantT[]> => [sorted, status, reload];

  const useItem = (id: Ref<BaseId | undefined>): AsyncState<VariantT | undefined> => [
    computed(() => (id.value ? items.value.find((i) => i.id === id.value) : undefined)),
    status,
    reload,
  ];

  const useRemoval = (id: Ref<BaseId | undefined>): Removal<T> => {
    const itemAs = useItem(id);
    const fn = () => (id.value ? opts.removeFn(id.value) : Promise.reject(new Error("id is required")));
    const [, rmStatus, rmExecute] = useAsyncState<T | undefined>(fn, undefined, {
      onSuccess: (r) => r && _remove(r.id),
    });

    return [rmStatus, rmExecute, itemAs];
  };

  const useUpsert = (id: Ref<BaseId | undefined>): Upsert<T> => {
    const itemAs = useItem(id);
    const form = useClonedReactive(itemAs[0], opts.newItem);
    const issues = useValidation(form, opts.upsertSchema);
    const [, upsertStatus, upsertExecute] = useAsyncState<T | undefined>(
      () => opts.upsertFn(form as VariantT),
      undefined,
      {
        onSuccess: async (r) => r && _upsert(await resolveFn(r)),
      },
    );
    return [form, issues, upsertStatus, upsertExecute, itemAs];
  };

  return {
    useAll,
    useItem,
    useRemoval,
    useUpsert,
  };
};
