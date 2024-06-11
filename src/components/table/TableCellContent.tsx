import { cn } from '@/utils/classname';
import { formatDate } from '@/utils/date.util';

import { CopyToClipboard } from '../CopyToClipboard';
import { OverflowText } from '../OverflowText';
import { Tooltip } from '../Tooltip';

import { Column } from './types';

export function TableCellContent<TData>(props: {
  col: Column<TData>;
  item: TData;
  onClick?: () => void;
  selectedRowsData: TData[];
}) {
  const { col, item, selectedRowsData } = props;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content = (item as unknown as Record<string, any>)[col.id as string];

  function getCell() {
    if (typeof col.cell === 'function') {
      return col.cell(item, selectedRowsData);
    }

    if (col.cell === 'highlight') {
      return (
        <div className="w-full font-medium text-brand">
          <OverflowText text={content || '-'} />
        </div>
      );
    }

    if (col.cell === 'date' && content) {
      return (
        <Tooltip title={content} placement="bottom-end">
          {formatDate(content)}
        </Tooltip>
      );
    }

    return <OverflowText text={content || '-'} />;
  }

  return (
    <div
      className={cn(
        'w-full',
        col.align === 'center' && 'flex justify-center',
        col.onClick && 'cursor-pointer relative'
      )}
      onClick={props.onClick}
    >
      {col.copy && <CopyToClipboard>{getCell()}</CopyToClipboard>}
      {!col.copy && getCell()}
    </div>
  );
}
