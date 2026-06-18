<script setup lang="ts">
import { computed } from "vue";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { useMemoStore } from "@/stores/memos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MultiLineInput, JsonTextArea } from "@/components/acrux-ui/fields";
import { Link as LinkIcon } from "@lucide/vue";

const props = defineProps<{ id: string | undefined }>();
const emit = defineEmits<{ (e: "close"): void }>();

const id = computed(() => props.id);
const { useUpsert } = useMemoStore();
const [form, issues, status, submit] = useUpsert(id);

const onSave = async () => {
  if (!(await issues.validate())) return;
  await submit();
  emit("close");
};
</script>

<template>
  <FieldSet class="w-md">
    <FieldLegend>{{ id ? "编辑" : "新建" }} Memo</FieldLegend>
    <FieldGroup>
      <Field :data-invalid="issues.errors('title').length > 0">
        <FieldLabel for="title">标题</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="title"
            v-model="form.title"
            autocomplete="off"
            placeholder="给这条 memo 起个标题"
            @focus="issues.ingore('title')"
          />
        </InputGroup>
        <FieldError :errors="issues.errors('title')" />
      </Field>
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
      <Field :data-invalid="issues.errors('link').length > 0">
        <FieldLabel for="link">链接</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <LinkIcon class="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            id="link"
            v-model="form.link"
            type="url"
            autocomplete="off"
            placeholder="https://example.com"
            @focus="issues.ingore('link')"
          />
        </InputGroup>
        <FieldError :errors="issues.errors('link')" />
      </Field>
      <Field>
        <FieldLabel>标签</FieldLabel>
        <MultiLineInput v-model="form.tags" placeholder="如 idea / work" add-text="添加标签" />
      </Field>
      <Field :data-invalid="issues.errors('metadata').length > 0">
        <Label>元数据 (JSON)</Label>
        <JsonTextArea
          v-model="form.metadata"
          @focus="issues.ingore('metadata')"
          @update:invalid="issues.set('metadata', $event ? ['JSON 格式无效'] : [])"
        />
        <FieldError :errors="issues.errors('metadata')" />
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
    <Button :disabled="status.loading" @click="onSave">保存</Button>
    <Button variant="secondary" :disabled="status.loading" @click="emit('close')">取消</Button>
  </div>
</template>
