export type MaybeAsync<T> = T | Promise<T>;

export function callMaybeAsync<T>(fn: () => MaybeAsync<T>): Promise<T> {
  const result = fn();
  if (result instanceof Promise) {
    return result;
  } else {
    return Promise.resolve(result);
  }
}
