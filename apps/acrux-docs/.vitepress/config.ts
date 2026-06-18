import { defineConfig } from "vitepress";

// Registry note: the shadcn-vue component registry is built by an npm script
// (`registry:build`, which delegates to the kitchen-sink app — the canonical
// source) into this
// app's static `public/r/acrux-ui/v0/` dir BEFORE `vitepress build`/`dev` runs.
// VitePress copies `public/` verbatim into the output, so the registry JSON is
// served same-domain at `/r/acrux-ui/v0/<name>.json` (prod: acrux.geektr.cloud)
// with zero config here. `public/r/` is gitignored (generated).

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Acrux",
  description: "Acrux docs and shadcn-vue component registry",

  themeConfig: {
    nav: [
      { text: "指南", link: "/guide/" },
      { text: "包", link: "/packages/core" },
      { text: "Registry", link: "/packages/registry" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "指南",
          items: [
            { text: "介绍", link: "/guide/" },
            { text: "快速开始", link: "/guide/getting-started" },
          ],
        },
      ],
      "/packages/": [
        {
          text: "包",
          items: [
            { text: "@acrux/core", link: "/packages/core" },
            { text: "@acrux/server", link: "/packages/server" },
            { text: "UI Registry", link: "/packages/registry" },
          ],
        },
      ],
    },

    socialLinks: [{ icon: "github", link: "https://github.com/geektr-cloud/cfworker-template" }],

    search: { provider: "local" },
  },
});
