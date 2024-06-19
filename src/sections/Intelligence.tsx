import React, { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/20/solid';
import {
  ArrowTrendingUpIcon,
  Bars3CenterLeftIcon,
} from '@heroicons/react/24/outline';
import { ChartBarIcon, ChartPieIcon } from '@heroicons/react/24/solid';

import { Button } from '@/components/Button';
import ChartWrapper from '@/components/charts/ChartWrapper';
import { Input, Type } from '@/components/form/Input';
import { Tooltip } from '@/components/Tooltip';
import { NoData } from '@/components/ui/NoData';
import { ChartType, MyResourceKey } from '@/types';
import { getAggregates as getAccountAggregates } from '@/utils/aggregates/account';
import { getAggregates as getRiskAggregates } from '@/utils/aggregates/risk';
import { getAggregates as getSeedAggregates } from '@/utils/aggregates/seed';
import { useStorage } from '@/utils/storage/useStorage.util';

interface ChartConfig {
  id: number;
  type: ChartType;
  width: string;
  endpoint: MyResourceKey;
  aggregate: string;
  label: string;
}

const widthToCols = (width: string) => {
  switch (width) {
    case '1/4':
      return 1;
    case '1/2':
      return 2;
    case '3/4':
      return 3;
    case 'full':
      return 4;
    default:
      return 1;
  }
};
const sizes = [
  { label: '\u00BC', width: '1/4', tooltip: '25%' },
  { label: '\u00BD', width: '1/2', tooltip: '50%' },
  { label: '\u00BE', width: '3/4', tooltip: '75%' },
  { label: '1', width: 'full', tooltip: '100%' },
];

const Intelligence: React.FC = () => {
  const [charts, setCharts] = useStorage<ChartConfig[]>(
    {
      key: 'intelligenceCharts',
    },
    []
  );
  const [newChartType, setNewChartType] = useState<ChartType>('area');
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(0);
  const [newEndpoint, setNewEndpoint] = useState<MyResourceKey>();
  const [aggregates, setAggregates] = useState<
    { value: string; label: string }[]
  >([]);
  const [aggregate, setAggregate] = useState<string>();

  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);

  useEffect(() => {
    if (newEndpoint) {
      switch (newEndpoint.toLowerCase()) {
        case 'account':
          setAggregates([
            ...Object.keys(getAccountAggregates()).map(id => ({
              value: id,
              label: getAccountAggregates()[id].label,
            })),
            {
              value:
                'https://github.com/praetorian-inc/chariot-ui/blob/main/src/utils/aggregates/account.ts',
              label: 'Contribute more...',
            },
          ]);
          break;
        case 'risk':
          setAggregates([
            ...Object.keys(getRiskAggregates()).map(id => ({
              value: id,
              label: getRiskAggregates()[id].label,
            })),
            {
              value:
                'https://github.com/praetorian-inc/chariot-ui/blob/main/src/utils/aggregates/risk.ts',
              label: 'Contribute more...',
            },
          ]);
          break;
        case 'seed':
          setAggregates([
            ...Object.keys(getSeedAggregates()).map(id => ({
              value: id,
              label: getSeedAggregates()[id].label,
            })),
            {
              value:
                'https://github.com/praetorian-inc/chariot-ui/blob/main/src/utils/aggregates/seed.ts',
              label: 'Contribute more...',
            },
          ]);
          break;
        default:
          setAggregates([]);
      }
    } else {
      setAggregates([]);
    }
  }, [newEndpoint]);

  const addChart = () => {
    if (newEndpoint && aggregate) {
      const selectedSize = sizes[selectedSizeIndex];
      setCharts([
        ...charts,
        {
          id: Date.now(),
          type: newChartType,
          width: selectedSize.width,
          endpoint: newEndpoint,
          aggregate,
          label: getAggregateName(aggregate),
        },
      ]);
      setIsFormVisible(false);
    }
  };

  const removeChart = (chartId: number) => {
    setCharts(charts.filter(chart => chart.id !== chartId));
  };

  const getAggregateName = (aggregate: string) => {
    switch (newEndpoint) {
      case 'account':
        return getAccountAggregates()[aggregate]?.label;
      case 'risk':
        return getRiskAggregates()[aggregate]?.label;
      case 'seed':
        return getSeedAggregates()[aggregate]?.label;
      default:
        return '';
    }
  };

  return (
    <div className="w-full">
      <div className="relative inline-block">
        <Button
          onClick={() => setIsFormVisible(!isFormVisible)}
          type="button"
          styleType="none"
          className="bg-header-light text-header-light"
          startIcon={<PlusIcon className="size-4" />}
        >
          Add Widget
        </Button>

        {isFormVisible && (
          <div className="absolute -right-[305px] top-0 z-10 mb-2 w-[300px]  rounded-[2px] bg-white p-4 shadow-xl">
            <Input
              type={Type.SELECT}
              name="endpoint"
              value={newEndpoint ?? ''}
              onChange={e => {
                setNewEndpoint(e.target.value as MyResourceKey);
                setAggregates([]);
                setAggregate(undefined);
              }}
              options={[
                { value: '', label: 'Select resource', disabled: true },
                { value: 'divider', label: '', divider: true },
                { value: 'seed', label: 'Seeds' },
                { value: 'asset', label: 'Assets', disabled: true },
                { value: 'risk', label: 'Risks' },
                { value: 'account', label: 'Accounts' },
                { value: 'job', label: 'Jobs', disabled: true },
                { value: 'attribute', label: 'Attributes', disabled: true },
                { value: 'ref', label: 'References', disabled: true },
                { value: 'file', label: 'File', disabled: true },
              ]}
            />
            {aggregates.length > 0 && (
              <Input
                disabled={!newEndpoint}
                type={Type.SELECT}
                name="aggregate"
                className="mt-4"
                value={aggregate ?? ''}
                onChange={e => {
                  setAggregate(e.target.value);
                }}
                options={[
                  {
                    value: '',
                    label: 'Select widget',
                    disabled: true,
                  },
                  { value: 'divider', label: '', divider: true },
                  ...(aggregates ?? []),
                ]}
              />
            )}
            {aggregate && newEndpoint && (
              <div className="mt-4 flex flex-col space-y-4">
                <div className="flex items-center justify-between space-x-4">
                  <Tooltip title="Area Chart" placement="top">
                    <button
                      className={`w-12 rounded-[4px] p-2 ${newChartType === 'area' ? 'bg-gray-400 text-white' : 'bg-gray-200'}`}
                      onClick={() => setNewChartType('area')}
                    >
                      <ChartBarIcon className="m-auto size-6" />
                    </button>
                  </Tooltip>
                  <Tooltip title="Line Chart" placement="top">
                    <button
                      className={`w-12 rounded-[4px] p-2 ${newChartType === 'line' ? 'bg-gray-400 text-white' : 'bg-gray-200'}`}
                      onClick={() => setNewChartType('line')}
                    >
                      <ArrowTrendingUpIcon className="m-auto size-6 stroke-[3px]" />
                    </button>
                  </Tooltip>
                  <Tooltip title="Bar Chart" placement="top">
                    <button
                      className={`w-12 rounded-[4px] p-2 ${newChartType === 'bar' ? 'bg-gray-400 text-white' : 'bg-gray-200'}`}
                      onClick={() => setNewChartType('bar')}
                    >
                      <Bars3CenterLeftIcon className="m-auto size-6 -rotate-90 stroke-[4px]" />
                    </button>
                  </Tooltip>
                  <Tooltip title="Donut Chart" placement="top">
                    <button
                      className={`w-12 rounded-[4px] p-2 ${newChartType === 'donut' ? 'bg-gray-400 text-white' : 'bg-gray-200'}`}
                      onClick={() => setNewChartType('donut')}
                    >
                      <ChartPieIcon className="m-auto size-6" />
                    </button>
                  </Tooltip>
                </div>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between space-x-4">
                    {sizes.map((size, index) => (
                      <Tooltip
                        key={size.label}
                        title={`${size.tooltip} width`}
                        placement="bottom"
                      >
                        <button
                          className={`h-8 w-12 rounded-[4px] text-xl ${
                            index === selectedSizeIndex
                              ? 'bg-gray-400 text-white'
                              : 'bg-gray-200'
                          }`}
                          onClick={() => {
                            setSelectedSizeIndex(index);
                          }}
                        >
                          {size.label}
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {aggregate && newEndpoint && (
              <div className="mt-4 flex justify-end space-x-2">
                <Button
                  onClick={() => setIsFormVisible(false)}
                  type="button"
                  styleType="secondary"
                  className="rounded-[4px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addChart}
                  type="button"
                  styleType="primary"
                  className="rounded-[4px]"
                >
                  Add Widget
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {charts.length === 0 && (
        <NoData
          title="No widgets"
          description={`Click on the Add Widget button to add a new widget`}
        />
      )}
      <div className="mt-4 grid grid-cols-4 gap-4">
        {charts.map(chart => (
          <div
            key={chart.id}
            className={`col-span-${widthToCols(chart.width)}`}
          >
            <ChartWrapper
              id={chart.id}
              type={chart.type}
              width={chart.width}
              endpoint={chart.endpoint}
              aggregate={chart.aggregate}
              label={chart.label}
              removeChart={removeChart}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Intelligence;
