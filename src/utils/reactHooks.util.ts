import { DependencyList, EffectCallback, useEffect, useState } from 'react';

/**
 * Hook returns true only component is rendered, you can use this along useEffect to execute function on prop change and not on component did mount
 * @returns boolean
 */
export function useGetComponentDidMount(): boolean {
  const [componentDidMount, setComponentDidMount] = useState(false);

  useEffect(() => {
    setComponentDidMount(true);
  }, []);

  return componentDidMount;
}

/**
 * Hook to execute function only on component did update. This is useful when you want to execute function on prop change and not on component did mount
 * @param effect Function to execute
 * @param deps Dependency list on which effect should be executed
 */
export function useComponentDidUpdate(
  effect: EffectCallback,
  deps?: DependencyList
) {
  const componentDidMount = useGetComponentDidMount();

  useEffect(() => {
    if (componentDidMount) {
      return effect();
    }
  }, deps);
}
