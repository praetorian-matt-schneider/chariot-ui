import { ReactNode, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { CopyToClipboard } from '@/components/CopyToClipboard';
import { Loader } from '@/components/Loader';

interface DetailsDrawerTableProps<TData> {
  title: string;
  data: TData[];
  columns: {
    id: keyof TData;
    className?: string;
    onClick?: (item: TData) => void;
    cell?: (item: TData) => ReactNode;
    copyData?: (item: TData) => string;
    copy?: boolean;
  }[];
  limit?: number;
  isLoading?: boolean;
}

export function DetailsDrawerTable<TData extends { key: string }>({
  isLoading,
  title,
  data = [],
  columns = [],
  limit = 5,
}: DetailsDrawerTableProps<TData>) {
  const [localLimit, setLocalLimit] = useState(limit);
  const showMore = data.length > limit;

  if (!data.length && !isLoading) {
    return null;
  }

  return (
    <Loader className="h-48" isLoading={isLoading}>
      <div>
        <div className="flex items-center justify-between border-b border-default py-3 ">
          <h6 className="font-bold">{title}</h6>
          {showMore && (
            <div
              className="cursor-pointer text-xs font-medium text-brand "
              onClick={() =>
                localLimit === data.length
                  ? setLocalLimit(limit)
                  : setLocalLimit(data.length)
              }
            >
              {localLimit === data.length ? 'View Less' : 'View All'}
            </div>
          )}
        </div>
        {data
          .slice(0, localLimit)
          .filter(row => row.key !== undefined && row.key !== '')
          .map((row, index) => (
            <div
              key={`${title.split(' ').join('-')}-${index}`}
              className="flex justify-between overflow-hidden border-b border-default py-3 text-sm"
            >
              {columns?.map(
                ({ id, className, onClick, cell, copy = true, copyData }) => (
                  <div
                    key={id as string}
                    className={twMerge(
                      'grow basis-0 overflow-hidden text-ellipsis',
                      onClick && 'cursor-pointer',
                      className
                    )}
                    onClick={onClick ? () => onClick(row) : undefined}
                  >
                    <CopyToClipboard
                      hideCopyIcon={!copy}
                      textToCopy={copyData ? copyData(row) : ''}
                    >
                      {cell ? cell(row) : (row[id] as string) || '-'}
                    </CopyToClipboard>
                  </div>
                )
              )}
            </div>
          ))}
        {showMore && (
          <span
            className="cursor-pointer text-xs text-gray-500"
            onClick={() =>
              localLimit === data.length
                ? setLocalLimit(limit)
                : setLocalLimit(limit => Math.min(limit + 10, data.length))
            }
          >
            {localLimit === data.length
              ? 'Show Less'
              : `and ${data.length - localLimit} more`}
          </span>
        )}
      </div>
    </Loader>
  );
}
