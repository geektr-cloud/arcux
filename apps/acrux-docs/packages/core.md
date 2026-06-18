# @acrux/core

前端抽象层（源码位于 `packages/acrux`）。元组式返回，配合 Pinia store。

::: warning 占位内容
以下为 API 清单骨架，签名与示例待补全。
:::

## API

### `useAsyncState(promise, initial, opts?)`

包装异步请求 → `[Ref<T>, { loading, error }, () => Promise<void>]`。

### `useHonoApi(apiFn, transform?)`

把 Hono RPC 调用包装成 `(...args) => Promise<Dto>`。

### `useSortedCollection(opts)`

内存排序集合 → `{ useAll, useItem, useRemoval, useUpsert }`。

### `useValidation(form, standardSchema)`

Standard Schema 校验 → `{ errors, ingore, valid, validate, useErrors }`。