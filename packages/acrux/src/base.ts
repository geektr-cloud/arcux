import { type Reactive, type Ref } from "vue";
import { type AsyncState, type AsyncStatus } from "./async";
import { type UseValidation } from "./issues";

/**
 * 实体主键类型
 */
export type BaseId = string;
export type BaseData = { id: BaseId };

/**
 * 分页信息结构
 */
export type Pagination = Reactive<{
  current: number; // 当前页码
  pageSize: number; // 每页大小
  total: number; // 总条目数
  totalPages: number; // 总页数
  go(page: number): void; // 跳转到指定页
}>;

/**
 * 异步分页列表
 * @template T
 * @typedef {[...AsyncState<T>, Pagination]}
 */
export type AsyncPaginatedList<T> = [...AsyncState<T>, page: Pagination];

/**
 * 游标分页结构
 */
export type Cursor = {
  key: BaseId; // 游标关键字
  limit: number; // 单次获取数量限制
  hasMore: boolean; // 是否还有更多数据
  next(): Promise<void>; // 获取下一页数据
};

/**
 * 基于游标的异步列表
 * @template T
 * @typedef {[...AsyncState<T>, Cursor]}
 */
export type AsyncCursorList<T> = [...AsyncState<T>, cursor: Cursor];

/**
 * 删除操作元组
 * @template T
 * @typedef {[AsyncState<T>, AsyncStatus, () => Promise<void>]}
 *   - source: 异步元数据 (AsyncState<T>)
 *   - status: 删除过程的异步状态 (AsyncStatus)
 *   - remove: 执行删除操作的函数 (() => Promise<void>)
 */
export type Removal<T> = [status: AsyncStatus, remove: () => Promise<void>, source: AsyncState<T | undefined>];

/**
 * UseRemoval 类型，参数为实体主键 Ref，返回 Removal 元组
 * @template T
 */
export type UseRemoval<T> = (id: Ref<BaseId | undefined>) => Removal<T | undefined>;

export type Upsert<T> = [
  form: Reactive<T>,
  issues: UseValidation,
  status: AsyncStatus,
  execute: () => Promise<void>,
  source: AsyncState<T | undefined>,
];
export type UseUpsert<T> = (id: Ref<BaseId | undefined>) => Upsert<T | undefined>;
