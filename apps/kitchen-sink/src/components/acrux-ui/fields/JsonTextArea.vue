<script setup lang="ts">
import { ref, watch } from "vue";
import { Textarea } from "@/components/ui/textarea";

const props = defineProps<{
  modelValue?: Record<string, unknown>;
  disabled?: boolean;
  class?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, unknown>];
  "update:invalid": [invalid: boolean];
}>();

const text = ref(JSON.stringify(props.modelValue ?? {}, null, 2));
const error = ref("");

watch(
  () => props.modelValue,
  (val) => {
    // Skip if our current text already represents this value (user is mid-edit)
    try {
      if (JSON.stringify(JSON.parse(text.value)) === JSON.stringify(val)) return;
    } catch {
      // text is currently invalid — always sync
    }
    text.value = JSON.stringify(val ?? {}, null, 2);
    error.value = "";
    emit("update:invalid", false);
  },
);

const onInput = (e: Event) => {
  const raw = (e.target as HTMLTextAreaElement).value;
  text.value = raw;
  try {
    emit("update:modelValue", JSON.parse(raw) as Record<string, unknown>);
    error.value = "";
    emit("update:invalid", false);
  } catch {
    error.value = "JSON 格式无效";
    emit("update:invalid", true);
  }
};
</script>

<template>
  <Textarea
    :value="text"
    :disabled="disabled"
    :class="['font-mono text-xs', props.class]"
    spellcheck="false"
    @input="onInput"
  />
  <p v-if="error" class="text-destructive text-xs">{{ error }}</p>
</template>
