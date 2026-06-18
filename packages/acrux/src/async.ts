import { type MaybeRef, type Reactive, type Ref, reactive } from "vue";
import { type UseAsyncStateOptions, useAsyncState as _useAsyncState } from "@vueuse/core";

/**
 * 异步状态，用于描述操作的加载与错误状态
 */
export type AsyncStatus = Reactive<{
  error: unknown;
  loading: boolean;
}>;

/**
 * 异步数据结构元组
 * @template T
 * @typedef {[Ref<T>, AsyncStatus, () => Promise<void>]}
 *   state: 数据引用
 *   status: 异步状态
 *   execute: 触发异步操作的函数
 */
export type AsyncState<T> = [state: Ref<T>, status: AsyncStatus, execute: () => Promise<void>];

/**
 * 自定义 useAsyncState 钩子，用于处理异步请求的数据、加载和错误状态。
 * @template Data 异步请求返回的数据类型
 * @param promise 执行异步请求的方法，返回 Promise<Data>
 * @param initialState 初始数据状态
 * @param options 可选配置项，继承自 @vueuse/core 的 UseAsyncStateOptions
 * @returns {[Ref<Data>, AsyncStatus, () => Promise<void>]}
 *    - state: 响应式数据引用
 *    - status: { loading: boolean, error: unknown }
 *    - execute: 手动触发异步请求的方法
 */
export const useAsyncState = <Data>(
  promise: () => Promise<Data>,
  initialState: MaybeRef<Data>,
  options?: UseAsyncStateOptions<true, Data>,
): AsyncState<Data> => {
  options = Object.assign({ shallow: true, immediate: false }, options);
  const { state, error, isLoading, execute } = _useAsyncState(promise, initialState, options);
  const fn = async () => {
    await execute();
  };
  return [state as Ref<Data>, reactive({ error, loading: isLoading }), fn];
};
