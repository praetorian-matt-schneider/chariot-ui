export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  timeout = 500
) {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), timeout);

    return () => {
      clearTimeout(timer);
    };
  };
}
