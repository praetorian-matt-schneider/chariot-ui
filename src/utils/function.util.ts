export function safeExecute<T>(
  fn: () => T,
  errorOrCallback: T | ((error: unknown) => T)
): T;
// eslint-disable-next-line no-redeclare
export function safeExecute<T>(
  fn: () => T,
  errorOrCallback?: T | ((error: unknown) => T | void)
): T | undefined;

// eslint-disable-next-line no-redeclare
export function safeExecute<T>(
  fn: () => T,
  errorOrCallback?: T | ((error: unknown) => T | void)
) {
  try {
    return fn();
  } catch (error) {
    if (errorOrCallback) {
      if (typeof errorOrCallback === 'function') {
        return (errorOrCallback as (error: unknown) => T)(error);
      } else {
        return errorOrCallback;
      }
    }
  }
}
