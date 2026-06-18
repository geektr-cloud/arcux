# 介绍

Acrux 是从 [cfworker-template](https://github.com/geektr-cloud/cfworker-template) 中沉淀的一套**全栈类型安全 CRUD 范式**，贯穿前端响应式集合到 D1 / Drizzle。

它以 pnpm monorepo 分发为两个包加一套 registry：

- **[@acrux/core](/packages/core)** — 前端抽象层（`useAsyncState` / `useSortedCollection` / `useValidation` / `useHonoApi`）。
- **[@acrux/server](/packages/server)** — 服务端 `createCrudRoutes` 工厂 + HTTP / 校验工具。
- **[UI Registry](/packages/registry)** — shadcn-vue 组件 registry，源码分发（源在 kitchen-sink，acrux-docs 托管）。

核心理念：前端 `useSortedCollection` 与后端 `createCrudRoutes` 是**对称镜像**，两端只共享 `{ id }` + Standard Schema 这一隐式契约。

::: warning 占位内容
本页为骨架，内容待补全。
:::