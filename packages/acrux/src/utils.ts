import { type Ref, reactive, ref, watch } from "vue";

export const deepCopy = <T>(value: T) => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return structuredClone(value);
  }
};

export const useClonedRef = <T>(v: Ref<T>) => {
  const cloned = ref({}) as Ref<T>;
  watch(v, (i) => (cloned.value = deepCopy(i)), { immediate: true });
  return cloned;
};

export const useClonedReactive = <T extends object>(v: Ref<T | undefined>, newValue: () => T) => {
  const cloned = reactive<T>(v.value ?? newValue());
  watch(v, (i) => Object.assign(cloned, deepCopy(i)), { immediate: true });
  return cloned;
};
