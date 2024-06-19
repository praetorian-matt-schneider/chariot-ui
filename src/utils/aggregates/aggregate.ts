export const getDateFromISO = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toISOString().split('T')[0];
};

export interface CountData {
  [key: string]: string | number;
}

interface AggregateDefinition<T> {
  label: string;
  run: (items: T[]) => CountData[];
  xField: string;
  yField: string;
}

export interface AggregateCollection<T> {
  [key: string]: AggregateDefinition<T>;
}

// Generic function to create aggregates by a key (like class, date, etc.)
function createAggregateBy<T>(
  items: T[],
  getKey: (item: T) => string,
  xField: string,
  yField: string
): CountData[] {
  return items.reduce((acc: CountData[], item) => {
    const key = getKey(item);
    const existingIndex = acc.findIndex(accItem => accItem[xField] === key);
    if (existingIndex === -1) {
      acc.push({ [xField]: key, [yField]: 1 });
    } else {
      acc[existingIndex][yField] = Number(acc[existingIndex][yField]) + 1;
    }
    return acc;
  }, []);
}

export function defineAggregate<T>(
  label: string,
  getKey: (item: T) => string,
  xField: string,
  yField: string
): AggregateDefinition<T> {
  return {
    label,
    run: (items: T[]) => createAggregateBy(items, getKey, xField, yField),
    xField,
    yField,
  };
}

export function runAggregate<T>(
  aggregates: AggregateCollection<T>,
  aggregateName: string,
  items: T[]
): CountData[] {
  const aggregate = aggregates[aggregateName];
  if (!aggregate) {
    throw new Error(`Aggregate '${aggregateName}' not found`);
  }
  return aggregate.run(items);
}

export function getAggregates<T>(
  aggregates: AggregateCollection<T>
): AggregateCollection<T> {
  return aggregates;
}
