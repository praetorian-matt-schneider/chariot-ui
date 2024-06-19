import { forwardRef, PropsWithChildren } from 'react';
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  hide,
  offset,
  Placement,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useMergeRefs,
  useRole,
} from '@floating-ui/react';

import { useStorage } from '@/utils/storage/useStorage.util';

import { Button, ButtonProps } from './Button';

export interface PopoverProps extends ButtonProps, PropsWithChildren {
  placement?: Placement;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

export const Popover = forwardRef<HTMLButtonElement, PopoverProps>(
  function Popover(props: PopoverProps, ref) {
    const {
      children,
      placement = 'bottom-start',
      open: openParent,
      setOpen: setOpenParent,
      ...buttonProps
    } = props;

    const [open, setOpen] = useStorage(
      {
        parentState: openParent,
        onParentStateChange: setOpenParent,
      },
      false
    );

    const floatingProps = useFloating({
      placement,
      open,
      onOpenChange: (open: boolean) => {
        // if (!open) {
        //   onClose?.();
        // }

        setOpen(open);
      },
      whileElementsMounted(referenceEl, floatingEl, update) {
        const cleanup = autoUpdate(referenceEl, floatingEl, update, {
          animationFrame: true,
        });
        return cleanup;
      },
      middleware: [
        hide({
          strategy: 'referenceHidden',
        }),
        offset(10),
        flip({
          crossAxis: false,
          mainAxis: true,
          padding: 10,
        }),
        shift({
          crossAxis: false,
          mainAxis: true,
          padding: 10,
        }),
        size({
          padding: 10,
          apply({ availableHeight, elements }) {
            elements.floating.style.maxHeight = `${availableHeight}px`;
          },
        }),
      ],
    });

    const click = useClick(floatingProps.context);
    const dismiss = useDismiss(floatingProps.context);
    const role = useRole(floatingProps.context);

    const interactions = useInteractions([click, dismiss, role]);
    const triggerRef = useMergeRefs([floatingProps.refs.setReference, ref]);

    return (
      <>
        <Button
          className={props.className}
          ref={triggerRef}
          {...interactions.getReferenceProps(buttonProps)}
        />
        {open && (
          <FloatingPortal>
            <FloatingFocusManager
              context={floatingProps.context}
              modal={false}
              initialFocus={-1}
            >
              <div
                ref={floatingProps.refs.setFloating}
                style={{
                  ...floatingProps.floatingStyles,
                  visibility: floatingProps.middlewareData.hide?.referenceHidden
                    ? 'hidden'
                    : 'visible',
                }}
                className="z-20 flex rounded-[4px] bg-layer0 p-4 shadow-md outline-none"
                {...interactions.getFloatingProps()}
              >
                {children || props.label}
              </div>
            </FloatingFocusManager>
          </FloatingPortal>
        )}
      </>
    );
  }
);
