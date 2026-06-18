<script setup lang="ts">
import Route from "@/components/acrux-ui/display/Route.vue";
import { useMemoStore } from "@/stores/memos";
import MemoEditor from "./MemoEditor.vue";
import Button from "@/components/ui/button/Button.vue";
import { useConfirmPopover, useFormModel } from "@/components/acrux-ui/actions";
import { File, SquarePen, Trash2 } from "@lucide/vue";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const { useAll, useRemoval } = useMemoStore();
const [items] = useAll();
const { update } = useFormModel(MemoEditor);

const removal = useConfirmPopover({
  message: "确定删除该 memo？",
  useRemoval,
});
</script>

<template>
  <div v-if="items.length > 0">
    <removal.ConfirmPopover />
    <Table>
      <TableCaption>共 {{ items.length }} 条 memo</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>内容</TableHead>
          <TableHead>标签</TableHead>
          <TableHead>状态</TableHead>
          <TableHead class="w-[120px]">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="row in items" :key="row.id">
          <TableCell class="max-w-[40ch] truncate">
            <Route :to="{ name: 'memo-detail', params: { id: row.id } }">
              {{ row.content || "(空)" }}
            </Route>
          </TableCell>
          <TableCell>
            <Badge v-for="tag in row.tags" :key="tag" variant="secondary" class="mr-1">
              {{ tag }}
            </Badge>
          </TableCell>
          <TableCell>
            <Badge v-if="row.pinned" variant="default" class="mr-1">置顶</Badge>
            <Badge v-if="row.archived" variant="outline">归档</Badge>
          </TableCell>
          <TableCell>
            <Button variant="ghost" size="icon" as-child>
              <RouterLink :to="{ name: 'memo-detail', params: { id: row.id } }">
                <File />
              </RouterLink>
            </Button>
            <Button variant="ghost" size="icon" @click="update(row.id)">
              <SquarePen />
            </Button>
            <Button
              variant="ghost"
              class="text-destructive hover:text-destructive"
              size="icon"
              @click="(e: MouseEvent) => removal.open(e, row.id)"
            >
              <Trash2 />
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
