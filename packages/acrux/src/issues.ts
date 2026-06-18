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

  // 外部注入的错误（非 schema 来源，如输入控件内部的“文本→值”转换失败）。
  // 校验的是 form，看不到这类错误，所以由字段组件通过 set(key, messages) 注入。
  const external = ref<Record<PropertyKey, StandardSchemaV1.Issue[]>>({});
  const set = (key: PropertyKey, messages: string[] | undefined) => {
    if (!messages?.length) delete external.value[key];
    else external.value[key] = messages.map((message) => ({ message }));
    external.value = { ...external.value };
  };

  // 忽略的键，通常在一轮报错之后，临时解除正在编辑的键的报错
  const ignored = shallowRef<PropertyKey[]>(Object.keys(form)); // todo: list deep keys
  const ingore = (key: PropertyKey) => {
    if (ignored.value.includes(key)) return;
    ignored.value = [...ignored.value, key];
  };

  // 扁平化错误映射（schema issues + 外部注入，均受 ignored 约束）
  const map = computed(() => {
    const result = issuesToMap(issues.value, ignored.value);
    for (const key of Reflect.ownKeys(external.value)) {
      if (ignored.value.includes(key)) continue;
      const list = external.value[key];
      if (list?.length) result[key] = [...(result[key] ?? []), ...list];
    }
    return result;
  });
  const errors = (key: PropertyKey) => map.value[key] ?? [];
  const useErrors = (key: PropertyKey) => computed(() => errors(key));
  const valid = (key: PropertyKey) => errors(key).length === 0;

  const validate = async () => {
    try {
      const r = await schema["~standard"].validate(form);
      issues.value = r.issues as StandardSchemaV1.Issue[];
      ignored.value = [];
      const hasExternal = Reflect.ownKeys(external.value).some((k) => external.value[k]?.length);
      return (issues.value?.length ?? 0) === 0 && !hasExternal;
    } catch (error) {
      console.error("validate failed", error);
      return false;
    }
  };

  return { ingore, errors, useErrors, valid, validate, set };
};

export type UseValidation = ReturnType<typeof useValidation>;
