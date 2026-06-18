---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Acrux"
  text: "全栈类型安全 CRUD 范式"
  tagline: Vue 3 + Hono + Drizzle (D1) 的抽象层与组件 registry
  actions:
    - theme: brand
      text: 开始使用
      link: /guide/
    - theme: alt
      text: 浏览包
      link: /packages/core

features:
  - title: "@acrux/core"
    details: 前端抽象层 —— useAsyncState / useSortedCollection / useValidation，元组式 API。
    link: /packages/core
  - title: "@acrux/server"
    details: 服务端 createCrudRoutes 工厂 + HTTP / 校验工具，与前端集合对称。
    link: /packages/server
  - title: "UI Registry"
    details: shadcn-vue 组件 registry，源码分发，消费端可改。源在 kitchen-sink，acrux-docs 托管。
    link: /packages/registry
---

::: warning 占位内容
本站为骨架，各页内容陆续补全。
:::