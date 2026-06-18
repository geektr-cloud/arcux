# UI Registry

shadcn-vue 组件 registry，以**源码分发**方式跨 app 复用 display / fields / page / actions 组件，消费端落地后仍可改源码。

::: warning 占位内容
内容待补全。
:::

## 源与构建

组件源码即 `kitchen-sink` 示例 app 自己安装并使用的副本（`apps/kitchen-sink/src/components/acrux-ui/**`）——kitchen-sink 存在的目的就是穷尽演练 acrux 的每一项能力，所以它的安装副本就是 registry 的**权威源**（dogfood）。清单是 `apps/kitchen-sink/registries/acrux-ui.json`。（该 app 对外/架构层叫 kitchen-sink，内部业务自我认知仍是 memos。）

本站（acrux-docs）是 registry 的**宿主**。构建由 npm script 完成（不在 `.vitepress/config.ts` 里特殊处理）：`pnpm --filter acrux-docs build` 先跑 `registry:build`（委托 `kitchen-sink` 的 `shadcn-vue build -c . -o ../acrux-docs/public/r/acrux-ui/v0 registries/acrux-ui.json`，cwd=kitchen-sink 使 `src/components/...` 相对路径解析到该 app、输出 JSON 保持消费端剥前缀所需的形态），把产物落进本站静态目录 `public/r/acrux-ui/v0/`，再跑 `vitepress build`——VitePress 原样把 `public/` 拷进产物，于是同域托管在 `/r/acrux-ui/v0/*`。

## Registry 端点

本站同域托管 registry JSON（版本 `v0`）：

```
https://acrux.geektr.cloud/r/acrux-ui/v0/{name}.json
```

## 消费

在消费端 `components.json` 配置命名空间：

```jsonc
{
  "registries": {
    "@acrux": "https://acrux.geektr.cloud/r/acrux-ui/v0/{name}.json"
  }
}
```

然后安装组件（基础 shadcn 依赖会自动解析进消费端的 `@/components/ui`）：

```bash
npx shadcn-vue add @acrux/page
```

## 当前 items

- `display` — 只读数据展示组件组（DataView/DataItem/VSeparator、CopyBtn/CopyTag、Link/Route、MultiLine、DateFormatter、QrBtn/QrModal）。
- `fields` — 复合输入组件组（MultiLineInput、JsonTextArea、EntitySelect）。
- `page` — CRUD 页面外壳（PageEntry 列表壳、PageDetail 详情壳、BackButton）。依赖 `display`，安装时自动一并拉取。
- `actions` — 破坏性/交互操作组（RemovalButton 删除确认按钮、ConfirmPopover + useConfirmPopover 行内锚定确认、useFormModel 模态表单）。