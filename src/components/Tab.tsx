import { ReactNode } from 'react';
import React from 'react';

import { Button } from '@/components/Button';
import { cn } from '@/utils/classname';
import { useStorage } from '@/utils/storage/useStorage.util';

export interface Tab<ID = string> {
  id: ID;
  label: ReactNode;
  Content: React.ElementType;
  contentProps?: object;
  tabClassName?: string;
  contentClassName?: string;
  hide?: boolean;
  icon?: JSX.Element;
}

export interface TabsProps<ID = string> {
  tabs: Tab<ID>[];
  defaultValue?: ID;
  value?: ID;
  onChange?: (value: ID) => void;
  className?: string;
  tabWrapperclassName?: string;
  tabWrapperStyle?: React.CSSProperties;
  contentWrapperClassName?: string;
  styleType?: 'vertical' | 'horizontal';
}

export function Tabs<ID = string>(props: TabsProps<ID>) {
  const defaultTab = props.defaultValue || props.tabs[0]?.id;
  const styleType = props.styleType || 'vertical';

  const [selectedTabId, setSelectedTabId] = useStorage(
    {
      parentState: props.value,
      onParentStateChange: props.onChange,
    },
    defaultTab
  );

  const tabLabels = props.tabs.filter(tab => tab.label);

  if (props.tabs.length === 0) return null;

  return (
    <div
      className={cn(
        styleType === 'horizontal' ? 'w-full' : 'flex h-full',
        props.className
      )}
    >
      {tabLabels.length > 0 && (
        <div
          className={cn(
            'border-layer1 overflow-auto flex flex-col',
            styleType === 'horizontal'
              ? 'flex-row w-full'
              : 'h-full flex-shrink-0',
            props.tabWrapperclassName
          )}
          style={props.tabWrapperStyle}
        >
          {tabLabels.map((tab, index) => {
            const isSelected = tab.id === selectedTabId;

            if (!tab.label || tab.hide) return null;

            return (
              <Button
                key={index}
                styleType="secondary"
                className={cn(
                  'w-full rounded-none border-x-0 shadow-none text-nowrap justify-start ',
                  index > 0 && 'mt-[-1px]',
                  isSelected && 'sticky top-0 left-0 z-10',
                  isSelected &&
                    styleType === 'horizontal' &&
                    'text-brand border-b-4 border-b-brand',
                  styleType === 'horizontal' &&
                    'justify-center bg-layer0 border-t-0 font-semibold',
                  tab.tabClassName
                )}
                isSelected={isSelected}
                onClick={() => {
                  setSelectedTabId(tab.id);
                }}
                startIcon={tab.icon}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>
      )}
      <div
        className={cn(
          'w-full px-4 overflow-auto h-full',
          props?.contentWrapperClassName
        )}
      >
        {props.tabs.map((tab, index) => {
          const isSelected = tab.id === selectedTabId;

          if (!isSelected) return null;

          return <tab.Content key={index} {...tab.contentProps} />;
        })}
      </div>
    </div>
  );
}
