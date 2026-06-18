<script setup lang="ts">
import { PageDetail } from "@/components/acrux-ui/page";
import { RemovalButton, useFormModel } from "@/components/acrux-ui/actions";
import { CopyBtn, DataItem, DataView, VSeparator } from "@/components/acrux-ui/display";
import { useRouteParams } from "@vueuse/router";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemoStore } from "@/stores/memos";
import { Edit } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
          <CardTitle class="text-base">Memo 详情</CardTitle>
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
            <DataItem label="内容">
              <p class="whitespace-pre-wrap">{{ item.content }}</p>
            </DataItem>
            <DataItem label="标签">
              <Badge v-for="tag in item.tags" :key="tag" variant="secondary" class="mr-1">
                {{ tag }}
              </Badge>
              <span v-if="item.tags.length === 0" class="text-zinc-500">无</span>
            </DataItem>
            <DataItem label="置顶">{{ item.pinned ? "是" : "否" }}</DataItem>
            <DataItem label="归档">{{ item.archived ? "是" : "否" }}</DataItem>
            <DataItem label="创建时间">{{ item.createdAt }}</DataItem>
            <DataItem label="更新时间">{{ item.updatedAt }}</DataItem>
          </DataView>
        </CardContent>
      </Card>
    </template>
  </PageDetail>
</template>
