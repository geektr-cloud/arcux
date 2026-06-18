<script setup lang="ts">
import { computed } from "vue";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useMemoStore } from "@/stores/memos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const props = defineProps<{ id: string | undefined }>();
const emit = defineEmits<{ (e: "close"): void }>();

const id = computed(() => props.id);
const { useUpsert } = useMemoStore();
const [form, issues, status, submit] = useUpsert(id);
</script>

<template>
  <FieldSet class="w-md">
    <FieldLegend>{{ id ? "编辑" : "新建" }} Memo</FieldLegend>
    <FieldGroup>
      <Field :data-invalid="issues.errors('content').length > 0">
        <FieldLabel for="content">内容</FieldLabel>
        <Textarea
          id="content"
          v-model="form.content"
          rows="6"
          placeholder="写点什么..."
          @focus="issues.ingore('content')"
        />
        <FieldError :errors="issues.errors('content')" />
      </Field>
      <Field>
        <FieldLabel for="tags">标签</FieldLabel>
        <Input
          id="tags"
          :model-value="form.tags.join(', ')"
          autocomplete="off"
          placeholder="逗号分隔，如 idea, work"
          @update:model-value="
            form.tags = ($event as string)
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          "
          @focus="issues.ingore('tags')"
        />
        <FieldError :errors="issues.errors('tags')" />
      </Field>
      <Field orientation="horizontal" class="flex items-center justify-between">
        <FieldLabel>置顶</FieldLabel>
        <Switch v-model="form.pinned" />
      </Field>
      <Field orientation="horizontal" class="flex items-center justify-between">
        <FieldLabel>归档</FieldLabel>
        <Switch v-model="form.archived" />
      </Field>
    </FieldGroup>
  </FieldSet>
  <div class="mt-4 flex justify-end gap-2">
    <Button :disabled="status.loading" @click="submit().then(() => emit('close'))">保存</Button>
    <Button variant="secondary" :disabled="status.loading" @click="emit('close')">取消</Button>
  </div>
</template>
