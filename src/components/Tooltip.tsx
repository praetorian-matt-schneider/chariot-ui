import { cloneElement, isValidElement, ReactNode } from 'react';
import type { Placement } from '@floating-ui/react';
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole,
  useTransitionStyles,
} from '@floating-ui/react';

import { useStorage } from '@/utils/storage/useStorage.util';

interface TooltipProps {
  title: ReactNode | string;
  children: ReactNode;
  placement?: Placement;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  delay?: number;
}

const animationDuration = 250;

export function Tooltip(props: TooltipProps) {
  const {
    placement = 'bottom',
    children,
    title,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    defaultOpen,
    delay = 100,
  } = props;

  const [open, setOpen] = useStorage(
    { parentState: controlledOpen, onParentStateChange: setControlledOpen },
    defaultOpen ?? false
  );

  const data = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({
        crossAxis: placement.includes('-'),
        fallbackAxisSideDirection: 'start',
        padding: 5,
      }),
      shift({ padding: 5 }),
    ],
  });

  const context = data.context;

  const { isMounted, styles } = useTransitionStyles(context, {
    duration: animationDuration,
    initial: {
      opacity: 0,
    },
  });

  const hover = useHover(context, {
    move: false,
    delay,
  });
  const focus = useFocus(context, {});
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const interactions = useInteractions([hover, focus, dismiss, role]);

  const validElement = isValidElement(children);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const childrenRef = (children as any).ref;

  const triggerRef = useMergeRefs([context.refs.setReference, childrenRef]);
  const tooltipRef = useMergeRefs([context.refs.setFloating]);

  return (
    <>
      {validElement &&
        cloneElement(
          children,
          interactions.getReferenceProps({
            ref: triggerRef,
            'data-state': context.open ? 'open' : 'closed',
            ...children?.props,
          })
        )}
      {!validElement && (
        <div
          ref={triggerRef}
          // The user can style the trigger based on the state
          data-state={context.open ? 'open' : 'closed'}
          {...interactions.getReferenceProps()}
        >
          {children}
        </div>
      )}
      {title && isMounted && (
        <FloatingPortal>
          <div
            ref={tooltipRef}
            className="max-w-sm rounded-[2px] bg-gray-700 p-2 text-xs text-white shadow-lg"
            style={{
              ...context.floatingStyles,
              ...styles,
              zIndex: 100, // Adding this, as tooltips need to be above other floating elements
            }}
            {...interactions.getFloatingProps()}
          >
            {title}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
