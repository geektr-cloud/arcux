import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { defineConfig } from "eslint/config";

/**
 * 共享 acrux ESLint flat config。
 * @param {object} [options]
 * @param {string[]} [options.ignores] 额外的 ignore 路径（追加到默认忽略后）。
 * @returns flat config 数组，可直接作为 eslint.config.* 的默认导出，或 spread 后追加本地规则。
 */
export function acruxEslintConfig({ ignores = [] } = {}) {
  return defineConfig([
    { ignores },
    {
      files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
      plugins: { js },
      extends: ["js/recommended"],
      languageOptions: { globals: globals.browser },
    },
    tseslint.configs.recommended,
    pluginVue.configs["flat/strongly-recommended"],
    { rules: { "vue/one-component-per-file": "off" } },
    {
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            ignoreRestSiblings: true,
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
          },
        ],
      },
    },
    { files: ["**/*.vue"], languageOptions: { parserOptions: { parser: tseslint.parser } } },
    { files: ["**/*.md"], plugins: { markdown }, language: "markdown/commonmark", extends: ["markdown/recommended"] },
    { files: ["**/*.css"], plugins: { css }, language: "css/css", extends: ["css/recommended"] },
    eslintConfigPrettier,
  ]);
}

export default acruxEslintConfig;
