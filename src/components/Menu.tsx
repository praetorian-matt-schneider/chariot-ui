import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, To } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

import { cn } from '@/utils/classname';

import { Button, ButtonProps } from './Button';
import { Dropdown } from './Dropdown';
import { OverflowText } from './OverflowText';
import { Tooltip } from './Tooltip';

export type MenuProps = {
  items: Omit<MenuItemProps, 'isFocused'>[];
  onClick?: (value?: string) => void;
  value?: string;
  className?: string;
};

interface subMenuOpenProps {
  isSubMenuOpen: boolean;
  setIsSubMenuOpen: (isSubMenuOpen: boolean) => void;
}

export const Menu: React.FC<MenuProps> = props => {
  const { className, items: unparsedItems, onClick, value } = props;

  const ulRef = useRef<HTMLUListElement>(null);

  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

  const [activeIndex, setActiveIndex] = React.useState<number>();

  const items = useMemo(() => {
    return unparsedItems.filter(item => !item.hide);
  }, [unparsedItems]);

  function findNextFocusableIndex(index: number, itemLength: number): number {
    if (checkIsNonFocusable(index)) {
      return index === itemLength
        ? -1
        : findNextFocusableIndex(
            index === itemLength ? 0 : index + 1,
            itemLength
          );
    }

    return index;
  }

  function findPreviousFocusableIndex(index: number, itemLength: number) {
    if (checkIsNonFocusable(index)) {
      return findPreviousFocusableIndex(
        index === 0 ? itemLength : index - 1,
        itemLength
      );
    }

    return index;
  }

  function checkIsNonFocusable(index: number): boolean {
    return (
      ['label', 'divider'].includes(items[index]?.type || '') ||
      items[index]?.disabled ||
      items[index]?.hide ||
      false
    );
  }

  useEffect(() => {
    if (!isSubMenuOpen) {
      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'k') {
          event.preventDefault();
          setActiveIndex(prevIndex => {
            const itemLength = items.length - 1;
            const nextValue =
              prevIndex !== undefined
                ? prevIndex === 0
                  ? itemLength
                  : prevIndex - 1
                : itemLength;

            const focusIndex = findPreviousFocusableIndex(
              nextValue,
              itemLength
            );

            return focusIndex;
          });
        } else if (
          event.key === 'ArrowDown' ||
          event.key.toLowerCase() === 'j'
        ) {
          event.preventDefault();
          setActiveIndex(prevIndex => {
            const itemLength = items.length - 1;
            const nextValue =
              prevIndex !== undefined
                ? prevIndex === itemLength
                  ? 0
                  : prevIndex + 1
                : 0;

            const focusIndex = findNextFocusableIndex(nextValue, itemLength);

            return focusIndex;
          });
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (typeof activeIndex === 'number') {
            const selectedLi = ulRef.current?.children[
              activeIndex
            ] as HTMLLIElement;
            selectedLi?.click();
          }
        } else if (event.key === 'Tab' && event.shiftKey) {
          setActiveIndex(undefined);
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [activeIndex, items, isSubMenuOpen]);

  useEffect(() => {
    if (items.length > 0) {
      const selectedIndex = value
        ? items.findIndex(item => item.value === value)
        : undefined;

      const focusIndex =
        selectedIndex && selectedIndex !== -1
          ? selectedIndex
          : findNextFocusableIndex(0, items.length - 1);

      setActiveIndex(focusIndex);
    }
  }, []);

  return (
    <ul
      ref={ulRef}
      className={cn(
        'relative w-full overflow-auto rounded-[2px] bg-layer0 shadow-lg outline-none ring-1 ring-default-dark',
        className
      )}
    >
      {items.map((item, index) => (
        <MenuItem
          key={index}
          {...item}
          isSubMenuOpen={isSubMenuOpen}
          setIsSubMenuOpen={setIsSubMenuOpen}
          isFocused={activeIndex === index}
          isSelected={value ? item.value === value : false}
          onClick={(...args) => {
            onClick?.(...args);
            item.onClick?.(...args);
          }}
        />
      ))}
    </ul>
  );
};

const menuMarginClassName = `m-[8px] w-[calc(100%-16px)]`;

export interface MenuItemProps {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  description?: string;
  type?: 'label' | 'divider';
  to?: To;
  download?: boolean;
  newTab?: boolean;
  disabled?: boolean;
  hide?: boolean;
  helpText?: string | React.ReactNode;
  onClick?: (value?: string) => void;
  isFocused?: boolean;
  isSelected?: boolean;
  styleType?: ButtonProps['styleType'];
  className?: string;
  tootlip?: string;
  isLoading?: boolean;
  checked?: boolean;
  submenu?: MenuItemProps[];
}

const MenuItem: React.FC<MenuItemProps & subMenuOpenProps> = props => {
  if (props.hide) {
    return null;
  }

  if (props.type === 'label') {
    const { label, className } = props;

    return (
      <li
        className={cn(
          'p-3 pb-0 text-xs font-medium text-default-light',
          menuMarginClassName,
          className
        )}
      >
        {label}
      </li>
    );
  }

  if (props.type === 'divider') {
    return (
      <li
        className={cn('m-2 -ml-2 border-t border-default', props.className)}
      />
    );
  }

  const { to, newTab, download, disabled, onClick, value } = props;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const handleClick = (event: any) => {
    event?.stopPropagation?.();

    if (!disabled) {
      onClick?.(value);
    }
  };

  if (to) {
    const isNewTab =
      newTab || download || (typeof to === 'string' && to.startsWith('http'));

    return (
      <Link
        onClick={handleClick}
        to={to}
        tabIndex={-1}
        {...(isNewTab
          ? {
              target: '_blank',
              rel: 'noreferrer',
            }
          : {})}
        {...(download
          ? {
              download: true,
            }
          : {})}
      >
        <MenuButton {...props} onClick={undefined}>
          <Content {...props} />
        </MenuButton>
      </Link>
    );
  }

  return (
    <MenuButton {...props} onClick={handleClick}>
      <Content {...props} />
    </MenuButton>
  );
};

function MenuButton(
  props: MenuItemProps & {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    children: ReactNode;
  } & subMenuOpenProps
) {
  const {
    disabled,
    onClick,
    isFocused,
    isSelected,
    children,
    styleType = 'text',
    className,
    tootlip,
    isLoading,
    submenu,
    isSubMenuOpen,
    setIsSubMenuOpen,
  } = props;

  const buttonClassName = cn(
    'relative text-start rounded-[2px] flex items-center justify-start px-4 m-0 py-2',
    isFocused ? 'outline-none z-10' : '',
    isSelected ? 'bg-gray-200' : '',
    menuMarginClassName,
    className
  );

  if (submenu && submenu.length > 0) {
    return (
      <Tooltip title={tootlip} placement="right">
        <Dropdown
          styleType={styleType}
          endIcon={<ChevronRightIcon className="size-4 " />}
          className={cn(buttonClassName)}
          tabIndex={-1}
          isLoading={isLoading}
          disabled={disabled}
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
          }}
          menu={{
            placement: 'right-start',
            className: 'm-0.5 -mt-2',
            items: submenu,
            open: isSubMenuOpen,
            onOpenChange: setIsSubMenuOpen,
          }}
        >
          {children}
        </Dropdown>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tootlip} placement="right">
      <Button
        tabIndex={-1}
        isLoading={isLoading}
        disabled={disabled}
        className={cn(buttonClassName)}
        onClick={onClick}
        styleType={styleType}
      >
        {children}
      </Button>
    </Tooltip>
  );
}

function Content(props: MenuItemProps) {
  const {
    label,
    icon,
    description,
    disabled: controlledDisabled,
    helpText,
    isLoading,
    checked,
  } = props;
  const labelText = !description && !helpText;

  const disabled = isLoading ? false : controlledDisabled;

  return (
    <>
      {icon && (
        <div className={`[&>svg]:size-5 [&>svg]:text-default-light`}>
          {icon}
        </div>
      )}
      <div className="w-full overflow-hidden">
        <div className="flex items-center justify-between text-sm">
          <div
            className={`overflow-hidden text-ellipsis ${labelText ? '' : 'font-semibold'} leading-8 ${disabled ? 'italic text-default-light' : ''} ${label === 'View All' && 'm-auto'}`}
          >
            <OverflowText text={label} placement="left" />
          </div>
        </div>
        {(description || helpText) && (
          <div
            className={`flex w-full gap-1 text-xs  ${disabled ? 'italic text-disabled' : 'text-default-light'}`}
          >
            {description}
            <span className="ml-auto text-nowrap">{helpText}</span>
          </div>
        )}
      </div>

      {checked && (
        <div className="text-default-light">
          <CheckCircleIcon className="size-4" />
        </div>
      )}
    </>
  );
}
