import { ReactNode } from 'react';

interface ConditionalRenderPorps {
  children: ReactNode;
  condition: boolean;
  conditionalWrapper: (children: ReactNode) => ReactNode;
}

export function ConditionalRender(props: ConditionalRenderPorps) {
  return props.condition
    ? props.conditionalWrapper(props.children)
    : props.children;
}
