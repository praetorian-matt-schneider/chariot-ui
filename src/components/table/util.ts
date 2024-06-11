import { useMemo } from 'react';

import { ActionsWithRowSelection } from './types';

export function mapActionsWithRowSelection<TData>(
  selectedRows: string[],
  data: TData[],
  rowData: TData,
  isGlobal: boolean,
  props?: ActionsWithRowSelection<TData>
) {
  return useMemo(() => {
    function updateProps(
      item: ActionsWithRowSelection<TData>['items'][0],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rowDatasToSend: any
    ) {
      return {
        onClick: () => {
          item.onClick?.(rowDatasToSend);
        },
        label:
          typeof item.label === 'function' ? item.label(rowData) : item.label,
        icon: typeof item.icon === 'function' ? item.icon(rowData) : item.icon,
        disabled:
          typeof item.disabled === 'function'
            ? item.disabled(rowDatasToSend)
            : item.disabled,
        hide:
          typeof item.hide === 'function'
            ? item.hide(rowDatasToSend)
            : item.hide,
      };
    }
    if (props) {
      const rowDatasToSend = isGlobal
        ? selectedRows.map(i => data[Number(i)]).filter(Boolean)
        : [rowData];

      return {
        ...props,
        items: props.items.map(item => {
          return {
            ...item,
            ...updateProps(item, rowDatasToSend),
            submenu: item.submenu?.map(item => ({
              ...item,
              ...updateProps(item, rowDatasToSend),
            })),
          };
        }),
      };
    }
  }, [props, selectedRows.length, data.length]);
}
