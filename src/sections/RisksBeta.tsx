import React, { useEffect, useMemo } from 'react';
import { BellIcon } from '@heroicons/react/24/solid';

import { Loader } from '@/components/Loader';
import { useMy } from '@/hooks';
import { useBulkCounts } from '@/hooks/useCounts';
import { useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { Alerts } from '@/sections/Alerts';
import { CategoryFilter, FancyTable } from '@/sections/Assets';
import { RenderHeaderExtraContentSection } from '@/sections/AuthenticatedApp';
import { useGlobalState } from '@/state/global.state';
import { RiskFilters } from '@/types';
import { useStorage } from '@/utils/storage/useStorage.util';

const RisksBeta: React.FC = () => {
  const {
    modal: {
      risk: { onOpenChange: onOpenRiskChange },
    },
  } = useGlobalState();
  const [filters, setFilters] = useStorage<RiskFilters>(
    { queryKey: 'riskFilters' },
    {
      search: '',
      alert: '',
      exposureRisk: '',
    }
  );
  //   Security alert options, count
  const { data: alerts, status: alertsStatus } = useGetAccountAlerts();

  //   Exposure risks
  const {
    data: conditions,
    status: conditionsStatus,
    refetch: refetchConditions,
  } = useMy({
    resource: 'condition',
  });
  //   Exposure risks counts
  const {
    data: attributesCount,
    status: attributesCountStatus,
    invalidate: refetchAttributesCount,
  } = useBulkCounts(
    conditions.map(({ value }) => ({
      resource: 'attribute',
      query: value.split('#attribute')[1],
    }))
  );

  const alertsOptions = useMemo(
    () =>
      (alerts || [])
        .map(alert => ({
          label: alert.name,
          value: alert.value,
          count: alert.count.toLocaleString(),
        }))
        .filter(({ value }) => !value.startsWith('#attribute')),
    [JSON.stringify({ alerts })]
  );

  const exposureRiskOptions = useMemo(
    () =>
      conditions?.map(({ name, value }) => ({
        label: name,
        value: `name:${name}#`,
        count: (
          attributesCount[value.endsWith('#') ? value.slice(0, -1) : value] || 0
        ).toLocaleString(),
      })) || [],
    [JSON.stringify({ attributesCount, conditions })]
  );

  // Add default filter if none is selected
  useEffect(() => {
    if (!filters.search && !filters.alert && !filters.exposureRisk) {
      if (alerts && alerts.length > 0) {
        setFilters({
          search: '',
          alert: alerts[0].value,
          exposureRisk: '',
        });
      }
      if (exposureRiskOptions && exposureRiskOptions.length > 0) {
        setFilters({
          search: '',
          alert: '',
          exposureRisk: exposureRiskOptions[0].value,
        });
      }
    }
  }, [JSON.stringify({ alerts, filters, exposureRiskOptions })]);

  function refetch() {
    refetchConditions();
    refetchAttributesCount();
  }

  return (
    <>
      <RenderHeaderExtraContentSection>
        <div className="m-auto flex w-full flex-col items-center rounded-lg border-2 border-dashed border-header-dark bg-header p-8 text-center">
          <Loader className="w-8" isLoading={conditionsStatus === 'pending'}>
            <BellIcon className="size-10 animate-bounce text-white" />
          </Loader>
          <h1 className="text-3xl font-bold text-white">
            Resolve a Risk Today
          </h1>
          <p className="max-w-[700px] text-sm text-gray-500">
            Keep your environment secure by addressing risks regularly.
          </p>
        </div>
      </RenderHeaderExtraContentSection>
      <FancyTable
        addNew={{ onClick: () => onOpenRiskChange(true) }}
        search={{
          value: filters.search,
          onChange: search => {
            setFilters({ search, alert: '', exposureRisk: '' });
          },
        }}
        className="h-0 min-h-0"
        name="risk"
        otherFilters={
          <>
            {alertsOptions.length > 0 && (
              <CategoryFilter
                value={filters.alert ? [filters.alert] : []}
                hideHeader={true}
                onChange={alerts => {
                  setFilters({
                    ...filters,
                    search: '',
                    exposureRisk: '',
                    alert: alerts[0],
                  });
                }}
                category={[
                  {
                    label: 'Security Alerts',
                    options: alertsOptions,
                    showCount: true,
                  },
                ]}
                status={alertsStatus}
              />
            )}
            {exposureRiskOptions.length > 0 && (
              <CategoryFilter
                value={filters.exposureRisk ? [filters.exposureRisk] : []}
                hideHeader={true}
                onChange={attributes => {
                  setFilters({
                    ...filters,
                    search: '',
                    alert: '',
                    exposureRisk: attributes[0],
                  });
                }}
                category={[
                  {
                    label: 'Exposure Risks',
                    options: exposureRiskOptions,
                    showCount:
                      attributesCountStatus === 'pending' ? false : true,
                  },
                ]}
                status={conditionsStatus}
              />
            )}
          </>
        }
      >
        {filters.search && (
          <Alerts
            query={filters.search}
            setQuery={() => {}}
            hideFilters={true}
            refetch={refetch}
          />
        )}
        {filters.alert && (
          <Alerts
            query={filters.alert}
            setQuery={() => {}}
            hideFilters={true}
            refetch={refetch}
          />
        )}
        {filters.exposureRisk && (
          <Alerts
            query={filters.exposureRisk}
            setQuery={() => {}}
            hideFilters={true}
            refetch={refetch}
          />
        )}
      </FancyTable>
    </>
  );
};

export default RisksBeta;
