import { useNavigate } from 'react-router-dom';

import { Accordian } from '@/components/Accordian';
import { Chip } from '@/components/Chip';
import { Drawer } from '@/components/Drawer';
import { HorizontalSplit } from '@/components/HorizontalSplit';
import { Loader } from '@/components/Loader';
import { Table } from '@/components/table/Table';
import { DetailsListContainer } from '@/components/ui/DetailsListContainer';
import { useMy } from '@/hooks';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useSearchParams } from '@/hooks/useSearchParams';
import { StorageKey } from '@/utils/storage/useStorage.util';

import { Risk } from '../../types';

import { Comment } from './Comment';
import { DetailsDrawerHeader } from './DetailsDrawerHeader';
import { useOpenDrawer } from './useOpenDrawer';
import { DRAWER_WIDTH } from '.';

interface Props {
  compositeKey: string;
  open: boolean;
}

const getSeverityChipProps = (value: number) => {
  if (value <= 2) {
    return {
      className: 'bg-indigo-100 text-indigo-900',
      name: 'Low',
      valueClassNames: 'bg-indigo-400',
    };
  } else if (value <= 5) {
    return {
      className: 'bg-amber-100 text-amber-900',
      name: 'Medium',
      valueClassNames: 'bg-amber-400',
    };
  } else if (value <= 8) {
    return {
      className: 'bg-pink-100 text-pink-900',
      name: 'High',
      valueClassNames: 'bg-pink-400',
    };
  } else if (value <= 10) {
    return {
      className: 'bg-red-100 text-red-900',
      name: 'Critical',
      valueClassNames: 'bg-red-400',
    };
  }

  return {};
};

export const KEVDrawer: React.FC<Props> = ({ compositeKey, open }: Props) => {
  const navigate = useNavigate();
  const { removeSearchParams } = useSearchParams();
  const kev = compositeKey.split('#')?.[2];
  const { openRisk } = useOpenDrawer();
  const { data: threats = [], isLoading } = useMy({
    resource: 'threat',
    query: compositeKey,
  });
  const { data: genericSearch, status: risksStatus } = useGenericSearch({
    query: kev,
  });

  const { risks = [] } = genericSearch || {};

  const threat = threats?.[0] || {};
  const severityProps = getSeverityChipProps(threat.value);

  return (
    <Drawer
      open={open}
      onClose={() => removeSearchParams(StorageKey.DRAWER_COMPOSITE_KEY)}
      onBack={() => navigate(-1)}
      className={DRAWER_WIDTH}
    >
      <Loader isLoading={isLoading} type="spinner">
        <div className="flex h-full flex-col gap-10">
          <DetailsDrawerHeader
            title={threat.name}
            subtitle={threat.source === 'KEV' ? 'CISA KEV' : ''}
          />

          <HorizontalSplit
            leftContainer={
              <>
                <Comment
                  title="Description"
                  comment={threat.comment}
                  isLoading={isLoading}
                />
                <Accordian title="Associated Risks" contentClassName="pt-0">
                  <Table
                    tableClassName="border-none p-0 shadow-none [&_.th-top-border]:hidden"
                    name="Associated Risks"
                    status={risksStatus}
                    data={risks}
                    columns={[
                      {
                        label: 'Name',
                        id: 'name',
                        cell: 'highlight',
                        onClick: (row: Risk) => openRisk(row),
                      },
                    ]}
                    error={null}
                    header={false}
                    footer={false}
                  />
                </Accordian>
              </>
            }
            rightContainer={
              <DetailsListContainer
                title="Vulnerability Details"
                list={[
                  {
                    label: '',
                    value: (
                      <div className="flex gap-2 text-sm">
                        <Chip className={`p-2 ${severityProps.className}`}>
                          <div className="flex items-center justify-center gap-2">
                            <span className="flex-1">{severityProps.name}</span>
                            <Chip
                              className={`w-fit px-4 text-white ${severityProps.valueClassNames}`}
                            >
                              {threat.value}
                            </Chip>
                          </div>
                        </Chip>
                      </div>
                    ),
                  },
                ]}
              />
            }
          />
        </div>
      </Loader>
    </Drawer>
  );
};
