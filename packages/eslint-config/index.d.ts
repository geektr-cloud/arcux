import type { Linter } from "eslint";

export interface AcruxEslintOptions {
  /** 额外的 ignore 路径（追加到默认忽略后）。 */
  ignores?: string[];
}

/** 共享 acrux ESLint flat config。 */
export function acruxEslintConfig(options?: AcruxEslintOptions): Linter.Config[];

export default acruxEslintConfig;
