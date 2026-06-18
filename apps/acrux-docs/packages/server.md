# @acrux/server

服务端抽象（源码位于 `packages/acrux-server`）。Hono + Drizzle (D1)。无 `cloudflare:workers` 耦合。

::: warning 占位内容
以下为 API 清单骨架，签名与示例待补全。
:::

## API

### `createCrudRoutes(opts)`

从 drizzle 表 + zod create/upsert schema 生成标准 6-endpoint CRUD 路由，是前端 `useSortedCollection` 的服务端镜像。`db` 实例注入，不内部 import。

```ts
import { createCrudRoutes } from "@acrux/server";

export const memoRoutes = createCrudRoutes({
  db,
  table: schema.memos,
  create: memoSchema.create.body,
  upsert: memoSchema.upsert.body,
  orderBy: (t) => [desc(t.pinned), desc(t.createdAt)],
});
```

### `HttpErr(status, message)` / `ErrorHandler`

抛出 `HttpErr`，全局 `ErrorHandler` 序列化成 `{ status, error }` JSON。

### `paramId` / `paramIdOrName` / `validJson`

Hono 校验件与 zod 辅助。