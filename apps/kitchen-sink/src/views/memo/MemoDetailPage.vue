<script setup lang="ts">
import { PageDetail } from "@/components/acrux-ui/page";
import { RemovalButton, useFormModel } from "@/components/acrux-ui/actions";
import {
  CopyBtn,
  CopyTag,
  DataItem,
  DataView,
  DateFormatter,
  Link,
  MultiLine,
  QrBtn,
  VSeparator,
} from "@/components/acrux-ui/display";
import { useRouteParams } from "@vueuse/router";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemoStore } from "@/stores/memos";
import { Edit } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import MemoEditor from "./MemoEditor.vue";

const id = useRouteParams<string>("id");
const { useItem, useRemoval } = useMemoStore();
const { update } = useFormModel(MemoEditor);

const [item, status, reload] = useItem(id);
const removal = useRemoval(id);
</script>

<template>
  <PageDetail :loading="status.loading" :error="status.error" @retry="reload">
    <template v-if="item">
      <Card>
        <CardHeader>
          <CardTitle class="text-base">{{ item.title || "Memo 详情" }}</CardTitle>
          <CardAction>
            <Button variant="secondary" @click="update(item!.id)">
              <Edit />
            </Button>
            <RemovalButton :ctx="removal" confirm="确定删除此 memo？不可恢复。" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataView>
            <DataItem label="ID">
              {{ item.id }}
              <VSeparator />
              <CopyBtn :value="item.id" />
            </DataItem>
            <DataItem label="标题">{{ item.title || "(无)" }}</DataItem>
            <DataItem label="内容">
              <MultiLine :value="item.content" />
            </DataItem>
            <DataItem label="链接">
              <Link :href="item.link || null" />
              <template v-if="item.link">
                <VSeparator />
                <QrBtn :value="item.link" small title="链接二维码" />
              </template>
            </DataItem>
            <DataItem label="标签">
              <CopyTag v-for="tag in item.tags" :key="tag" :value="tag" variant="secondary" class="mr-1" />
              <span v-if="item.tags.length === 0" class="text-zinc-500">无</span>
            </DataItem>
            <DataItem label="元数据">
              <pre class="text-xs whitespace-pre-wrap break-all">{{ JSON.stringify(item.metadata, null, 2) }}</pre>
            </DataItem>
            <DataItem label="置顶">{{ item.pinned ? "是" : "否" }}</DataItem>
            <DataItem label="归档">{{ item.archived ? "是" : "否" }}</DataItem>
            <DataItem label="创建时间">
              <DateFormatter :value="item.createdAt" />
            </DataItem>
            <DataItem label="更新时间">
              <DateFormatter :value="item.updatedAt" />
              <VSeparator />
              <DateFormatter :value="item.updatedAt" format="distance" class="text-zinc-500" />
            </DataItem>
          </DataView>
        </CardContent>
      </Card>
    </template>
  </PageDetail>
</template>
