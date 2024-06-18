import React, { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/20/solid';
import {
  ArrowTrendingUpIcon,
  Bars3CenterLeftIcon,
} from '@heroicons/react/24/outline';
import { ChartBarIcon, ChartPieIcon } from '@heroicons/react/24/solid';

import { Button } from '@/components/Button';
import { Input, Type } from '@/components/form/Input';
import ChartWrapper from '@/sections/dashboard/ChartWrapper';
import { ChartType, MyResourceKey } from '@/types';
import { getAggregates as getAccountAggregates } from '@/utils/aggregates/account';
import { getAggregates as getRiskAggregates } from '@/utils/aggregates/risk';

interface ChartConfig {
  id: number;
  type: ChartType;
  width: string;
  endpoint: MyResourceKey;
  aggregate: string;
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
  { label: '\u00BC', width: '1/4' },
  { label: '\u00BD', width: '1/2' },
  { label: '\u00BE', width: '3/4' },
  { label: 'Full', width: 'full' },
];

const Dashboard: React.FC = () => {
  const [charts, setCharts] = useState<ChartConfig[]>([]);
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
          setAggregates(
            Object.keys(getAccountAggregates()).map(id => ({
              value: id,
              label: getAccountAggregates()[id].label,
            }))
          );
          break;
        case 'risk':
          setAggregates(
            Object.keys(getRiskAggregates()).map(id => ({
              value: id,
              label: getRiskAggregates()[id].label,
            }))
          );
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
        },
      ]);
      setIsFormVisible(false);
    }
  };

  const removeChart = (chartId: number) => {
    setCharts(charts.filter(chart => chart.id !== chartId));
  };

  return (
    <div className="w-full px-4 py-2">
      <div className="relative inline-block">
        <Button
          onClick={() => setIsFormVisible(!isFormVisible)}
          type="button"
          styleType="primary"
          startIcon={<PlusIcon className="size-4" />}
        >
          Add Chart
        </Button>

        {isFormVisible && (
          <div className="absolute left-0 top-[50px] z-10 mb-2 w-[420px] rounded-[4px] bg-white p-4 shadow-md">
            <div className="flex flex-col space-y-4">
              <div className="grid grid-cols-[30%_1fr] items-center">
                <label className="block font-semibold text-gray-700">
                  Chart Type
                </label>
                <div className="flex items-center justify-between space-x-4">
                  <button
                    className={`w-12 rounded-[4px] p-2 ${newChartType === 'area' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setNewChartType('area')}
                  >
                    <ChartBarIcon className="m-auto size-6" />
                  </button>
                  <button
                    className={`w-12 rounded-[4px] p-2 ${newChartType === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setNewChartType('line')}
                  >
                    <ArrowTrendingUpIcon className="m-auto size-6 stroke-[3px]" />
                  </button>
                  <button
                    className={`w-12 rounded-[4px] p-2 ${newChartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setNewChartType('bar')}
                  >
                    <Bars3CenterLeftIcon className="m-auto size-6 -rotate-90 stroke-[4px]" />
                  </button>
                  <button
                    className={`w-12 rounded-[4px] p-2 ${newChartType === 'donut' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setNewChartType('donut')}
                  >
                    <ChartPieIcon className="m-auto size-6" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-[30%_1fr] items-center">
                <label className="block font-semibold text-gray-700">
                  Width
                </label>
                <div className="flex items-center justify-between space-x-4">
                  {sizes.map((size, index) => (
                    <button
                      key={size.label}
                      className={`h-8 w-12 rounded-[2px] text-xl ${
                        index === selectedSizeIndex
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200'
                      }`}
                      onClick={() => {
                        setSelectedSizeIndex(index);
                      }}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-[30%_1fr] items-center">
                <label className="block font-semibold text-gray-700">
                  Resource
                </label>
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
                    { value: '', label: 'Select a resource', disabled: true },
                    { value: 'divider', label: '', divider: true },
                    { value: 'account', label: 'Account' },
                    { value: 'risk', label: 'Risk' },
                    { value: 'asset', label: 'Asset', disabled: true },
                    { value: 'ref', label: 'Reference', disabled: true },
                    { value: 'job', label: 'Job', disabled: true },
                    { value: 'seed', label: 'Seed', disabled: true },
                    { value: 'attribute', label: 'Attribute', disabled: true },
                    { value: 'file', label: 'File', disabled: true },
                    { value: 'threat', label: 'Threat', disabled: true },
                  ]}
                />
              </div>
              {aggregates.length > 0 && (
                <div className="grid grid-cols-[30%_1fr] items-center">
                  <label className="block font-semibold text-gray-700">
                    Metric
                  </label>
                  <Input
                    disabled={!newEndpoint}
                    type={Type.SELECT}
                    name="aggregate"
                    value={aggregate ?? ''}
                    onChange={e => setAggregate(e.target.value)}
                    options={[
                      {
                        value: '',
                        label: 'Select an aggregate',
                        disabled: true,
                      },
                      { value: 'divider', label: '', divider: true },
                      ...(aggregates ?? []),
                    ]}
                  />
                </div>
              )}
            </div>
            <Button
              onClick={addChart}
              type="button"
              styleType="secondary"
              className="ml-auto mt-4"
            >
              Add Chart
            </Button>
          </div>
        )}
      </div>

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
              removeChart={removeChart}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
