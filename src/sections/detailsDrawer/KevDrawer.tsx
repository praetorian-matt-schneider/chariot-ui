import { Chip } from '@/components/Chip';
import { Loader } from '@/components/Loader';
import { useMy } from '@/hooks';
import { useGenericSearch } from '@/hooks/useGenericSearch';

import { Risk } from '../../types';

import { DetailsDrawerHeader } from './DetailsDrawerHeader';
import { DetailsDrawerTable } from './DetailsDrawerTable';
import { useOpenDrawer } from './useOpenDrawer';

interface Props {
  compositeKey: string;
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

export const KEVDrawer: React.FC<Props> = ({ compositeKey }: Props) => {
  const kev = compositeKey.split('#')?.[2];
  const { openRisk } = useOpenDrawer();
  const { data: threats = [], isLoading } = useMy({
    resource: 'threat',
    query: compositeKey,
  });
  const { data: genericSearch, isLoading: isLoadingRisks } = useGenericSearch({
    query: kev,
  });

  const { risks = [] } = genericSearch || {};

  const threat = threats?.[0] || {};
  const severityProps = getSeverityChipProps(threat.value);

  return (
    <div className="flex h-[calc(100%-24px)] flex-col gap-8">
      <DetailsDrawerHeader
        title={threat.name}
        subtitle={threat.source === 'KEV' ? 'CISA KEV' : ''}
        isLoading={isLoading}
      />

      {!isLoading && (
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
      )}

      <Loader className="h-48" isLoading={isLoading}>
        <p className="text-sm text-default-light">{threat.comment}</p>
      </Loader>

      <DetailsDrawerTable<{ label: string; key: string }>
        title="Vulnerability Details"
        isLoading={isLoading}
        data={[{ label: 'Vulnerability ID', key: threat.name }]}
        columns={[
          { id: 'label', className: 'text-default-light', copy: false },
          { id: 'key', className: 'text-right' },
        ]}
      />

      <DetailsDrawerTable<Risk>
        isLoading={isLoadingRisks}
        title="Risks"
        data={risks}
        columns={[
          {
            id: 'name',
            className: 'text-primary',
            onClick: (row: Risk) => openRisk(row),
          },
        ]}
      />
    </div>
  );
};
