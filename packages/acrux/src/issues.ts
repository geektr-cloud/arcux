import type { StandardSchemaV1 } from "@standard-schema/spec";
import { computed, ref, shallowRef } from "vue";

// Validation
export type Issues = readonly StandardSchemaV1.Issue[] | undefined;

const issuesToMap = (issues: Issues, ignored: PropertyKey[]) => {
  const result: Record<PropertyKey, StandardSchemaV1.Issue[]> = {};
  for (const issue of issues ?? []) {
    for (const path of issue.path ?? []) {
      if (ignored.includes(path as PropertyKey)) continue;

      const key = (path as { key: PropertyKey })?.key || (path as PropertyKey);
      result[key] = result[key] ?? [];
      result[key]!.push(issue);
    }
  }
  return result;
};

export const useValidation = <T extends object>(form: T, schema: StandardSchemaV1) => {
  // 验证结果
  const issues = ref<StandardSchemaV1.Issue[] | undefined>(undefined);

  // 忽略的键，通常在一轮报错之后，临时解除正在编辑的键的报错
  const ignored = shallowRef<PropertyKey[]>(Object.keys(form)); // todo: list deep keys
  const ingore = (key: PropertyKey) => {
    if (ignored.value.includes(key)) return;
    ignored.value = [...ignored.value, key];
  };

  // 扁平化错误映射
  const map = computed(() => issuesToMap(issues.value, ignored.value));
  const errors = (key: PropertyKey) => map.value[key] ?? [];
  const useErrors = (key: PropertyKey) => computed(() => errors(key));
  const valid = (key: PropertyKey) => errors(key).length === 0;

  const validate = async () => {
    try {
      const r = await schema["~standard"].validate(form);
      issues.value = r.issues as StandardSchemaV1.Issue[];
      ignored.value = [];
    } catch (error) {
      console.error("validate failed", error);
    }
  };

  return { ingore, errors, useErrors, valid, validate };
};

export type UseValidation = ReturnType<typeof useValidation>;
