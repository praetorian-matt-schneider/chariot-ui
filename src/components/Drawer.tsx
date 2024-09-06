import { ReactNode, useEffect, useRef, useState } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { ChevronLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';
import { twMerge } from 'tailwind-merge';

import { MODAL_WRAPPER_ID } from '@/components/Modal';
import { useMutationObserver } from '@/hooks/useMutationObserver';
import { cn } from '@/utils/classname';

interface Props {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  children: React.ReactNode;
  zIndex?: number;
  className?: string;
  footer?: ReactNode;
  footerClassname?: string;
  contentClassName?: string;
  skipBack?: boolean;
}

export function Drawer({
  open,
  onClose,
  onBack,
  children,
  zIndex,
  className,
  footer,
  footerClassname,
  contentClassName,
  skipBack,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [domHasModal, setDomHasModal] = useState(false);

  useMutationObserver(
    document.body,
    mutations => {
      const modalIsAdded = Array.from(mutations).some(
        mutation =>
          mutation.type === 'childList' &&
          Array.from(mutation.addedNodes).some(node => {
            return (node as Element).id === MODAL_WRAPPER_ID;
          })
      );

      const modalIsRemoved = Array.from(mutations).some(
        mutation =>
          mutation.type === 'childList' &&
          Array.from(mutation.removedNodes).some(node => {
            return (node as Element).id === MODAL_WRAPPER_ID;
          })
      );

      modalIsAdded && setDomHasModal(true);
      modalIsRemoved && setDomHasModal(false);
    },
    { childList: true }
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      event.stopPropagation();
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (open && !domHasModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, domHasModal, onClose]);

  return (
    <Transition appear show={open} as={Fragment}>
      <div
        className={twMerge('relative', !zIndex && 'z-10')}
        style={{ zIndex }}
        onClick={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 h-full">
          <div className="flex h-full items-end justify-center">
            <Transition.Child
              as={Fragment}
              enter="drawer-enter"
              enterFrom="drawer-enter"
              enterTo="drawer-enter-active"
              leave="drawer-exit"
              leaveFrom="drawer-exit"
              leaveTo="drawer-exit-active"
            >
              <div
                className={cn(
                  'relative border-t border-t-default flex flex-col bg-layer0 w-full',
                  className
                )}
                onClick={event => event.stopPropagation()}
                style={{
                  height: 'calc(100% - 40px)',
                  maxHeight: 'calc(100% - 40px)',
                }}
                ref={ref}
              >
                {!skipBack && (
                  <div
                    role="button"
                    onClick={onBack}
                    className="absolute left-6 top-0 -mt-11 flex cursor-pointer flex-row items-center  text-white"
                  >
                    <ChevronLeftIcon className="mr-2 size-10" /> Go Back
                  </div>
                )}
                <div
                  role="button"
                  onClick={onClose}
                  className="absolute right-6 top-0 -mt-11 flex cursor-pointer flex-row items-center  text-white"
                >
                  Close <XMarkIcon className="mr-2 size-10" />
                </div>
                <div
                  className={cn(
                    'h-full overflow-auto text-default',
                    contentClassName
                  )}
                >
                  {children}
                </div>
                {footer && (
                  <div
                    className={cn(
                      'flex w-full flex-row items-center justify-center',
                      footerClassname
                    )}
                  >
                    {footer}
                  </div>
                )}
              </div>
            </Transition.Child>
          </div>
        </div>
      </div>
    </Transition>
  );
}
