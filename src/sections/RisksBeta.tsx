import React, { useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/solid';

import { Loader } from '@/components/Loader';
import { useMy } from '@/hooks';
import { useCounts } from '@/hooks/useCounts';
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
      attribute: '',
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
    refetch: refetchAttributesCount,
  } = useCounts({
    resource: 'attribute',
  });

  const alertsOptions =
    alerts?.map(alert => ({
      label: alert.name,
      value: alert.value,
      count: alert.count.toLocaleString(),
    })) || [];

  const attributeOptions =
    conditions?.map(({ value }) => ({
      label: value,
      value,
      count: (
        (attributesCountStatus === 'success' &&
          attributesCount &&
          attributesCount[value.slice(0, -1)]) ||
        0
      ).toLocaleString(),
    })) || [];

  useEffect(() => {
    if (
      !filters.search &&
      !filters.alert &&
      !filters.attribute &&
      alerts &&
      alerts.length
    ) {
      setFilters({
        search: '',
        alert: alerts[0].value,
        attribute: '',
      });
    }
  }, [JSON.stringify({ alerts, filters })]);

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
            setFilters({ search, alert: '', attribute: '' });
          },
        }}
        name="risk"
        otherFilters={
          <>
            <CategoryFilter
              value={filters.alert ? [filters.alert] : []}
              hideHeader={true}
              onChange={alerts => {
                setFilters({
                  ...filters,
                  search: '',
                  attribute: '',
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
            <CategoryFilter
              value={filters.attribute ? [filters.attribute] : []}
              hideHeader={true}
              onChange={attributes => {
                setFilters({
                  ...filters,
                  search: '',
                  alert: '',
                  attribute: attributes[0],
                });
              }}
              category={[
                {
                  label: 'Exposure Risks',
                  options: attributeOptions,
                  showCount: true,
                },
              ]}
              status={conditionsStatus}
            />
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
        {filters.attribute && (
          <Alerts
            query={filters.attribute}
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
