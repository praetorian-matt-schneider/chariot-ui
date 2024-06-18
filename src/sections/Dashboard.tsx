import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/20/solid';
import {
  ArrowTrendingUpIcon,
  Bars3CenterLeftIcon,
  ChartBarIcon,
  ChartPieIcon,
} from '@heroicons/react/24/solid';

import { Button } from '@/components/Button';
import ChartWrapper from '@/sections/dashboard/ChartWrapper';
import { ChartType, MyResourceKey } from '@/types'; // Adjust paths as needed
import { getAggregates as getAccountAggregates } from '@/utils/aggregates/account';
import { getAggregates as getRiskAggregates } from '@/utils/aggregates/risk';

interface ChartConfig {
  id: number;
  type: ChartType;
  width: string;
  endpoint: MyResourceKey;
  aggregate: string;
}

const Dashboard: React.FC = () => {
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [newChartType, setNewChartType] = useState<ChartType>('area');
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(0); // Initial index for 1/4 (zero-based)
  const [newEndpoint, setNewEndpoint] = useState<MyResourceKey>('account');
  const [aggregate, setAggregate] = useState<string>('');

  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);

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

  const getAggregates = () => {
    switch (newEndpoint) {
      case 'account':
        return getAccountAggregates();
      case 'risk':
        return getRiskAggregates();
      default:
        return {};
    }
  };

  const addChart = () => {
    if (aggregate && aggregate in getAggregates()) {
      const selectedSize = sizes[selectedSizeIndex];
      setCharts([
        ...charts,
        {
          id: Date.now(),
          type: newChartType,
          width: selectedSize.width, // Using Tailwind CSS classes directly
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
                    <ArrowTrendingUpIcon className="m-auto size-6" />
                  </button>
                  <button
                    className={`w-12 rounded-[4px] p-2 ${newChartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setNewChartType('bar')}
                  >
                    <Bars3CenterLeftIcon className="m-auto size-6 -rotate-90" />
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
                      onClick={() => setSelectedSizeIndex(index)}
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
                <select
                  className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={newEndpoint}
                  onChange={e =>
                    setNewEndpoint(e.target.value as MyResourceKey)
                  }
                >
                  <option value="account">Account</option>
                  <option value="risk">Risk</option>
                  <option value="asset" disabled>
                    Asset
                  </option>
                  <option value="ref" disabled>
                    Reference
                  </option>
                  <option value="job" disabled>
                    Job
                  </option>
                  <option value="seed" disabled>
                    Seed
                  </option>
                  <option value="attribute" disabled>
                    Attribute
                  </option>
                  <option value="file" disabled>
                    File
                  </option>
                  <option value="threat" disabled>
                    Threat
                  </option>
                </select>
              </div>
              <div className="grid grid-cols-[30%_1fr] items-center">
                <label className="block font-semibold text-gray-700">
                  Metric
                </label>
                <select
                  className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={aggregate}
                  onChange={e => setAggregate(e.target.value)}
                >
                  <option defaultChecked value="">
                    Select an Aggregate
                  </option>
                  {Object.keys(getAggregates()).map(id => (
                    <option key={id} value={id}>
                      {getAggregates()[id].label}
                    </option>
                  ))}
                </select>
              </div>
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
