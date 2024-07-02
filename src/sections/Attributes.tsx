import { PlusIcon } from '@heroicons/react/24/outline';

import { Link } from '@/components/Link';
import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import { useMy } from '@/hooks';
import { useOpenDrawer } from '@/sections/detailsDrawer/useOpenDrawer';
import { useGlobalState } from '@/state/global.state';
import { Attribute } from '@/types';
import { prettyPrint } from '@/utils/prettyPrint.util';
import { useNavigate } from 'react-router-dom';

export function Attributes() {
  const {
    data: attributes,
    status,
    error,
    isFetchingNextPage,
    fetchNextPage,
  } = useMy({ resource: 'attribute', filterByGlobalSearch: true });
  const { getAssetDrawerLink } = useOpenDrawer();
  const navigate = useNavigate();

  const {
    modal: { attribute },
  } = useGlobalState();

  const columns: Columns<Attribute> = [
    {
      label: 'Asset',
      id: 'name',
      className: 'w-full',
      copy: false,
      cell: item => {
        const ip = item.key.split('#')[3];
        return (
          <button
            className="cursor-pointer truncate font-medium text-brand"
            onClick={() => {
              navigate(getAssetDrawerLink({ dns: item.dns, name: ip }));
            }}
          >
            {ip !== item.dns ? (
              <span>
                {item.dns} ({ip})
              </span>
            ) : (
              item.dns
            )}
          </button>
        );
      },
    },
    {
      label: 'Class',
      id: 'class',
      className: 'w-[220px]',
      copy: true,
      cell: item => {
        if (Number.isNaN(Number.parseInt(item.class))) {
          return prettyPrint(item.class);
        } else {
          return item.class;
        }
      },
    },
    {
      label: 'Name',
      id: 'name',
      className: 'w-[190px]',
      copy: true,
      cell: item => {
        // if item is a date
        if (item.class === 'expiration') {
          return (
            <Tooltip title={item.name}>
              {new Date(item.name).toLocaleDateString()}
            </Tooltip>
          );
        } else {
          return item.name;
        }
      },
    },
    {
      label: 'Last Seen',
      id: 'updated',
      cell: 'date',
    },
  ];

  return (
    <Table
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      name={'attributes'}
      columns={columns}
      data={attributes}
      primaryAction={() => {
        return {
          label: 'Add Attribute',
          onClick: () => {
            attribute.onOpenChange(true);
          },
          startIcon: <PlusIcon className="size-5" />,
        };
      }}
      status={status}
      error={error}
      skipHeader
    />
  );
}
