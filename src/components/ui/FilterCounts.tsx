import { capitalize } from '@/utils/lodash.util';

interface Props {
  count: number;
  type: string;
  total?: number;
}

const FilterCounts: React.FC<Props> = ({ count, type, total }: Props) => {
  return (
    <>
      {total ? (
        <span className="ml-auto text-2xl font-bold">{`${count.toLocaleString()} / ${total.toLocaleString()} ${capitalize(type)} Shown`}</span>
      ) : (
        <span className="ml-auto text-2xl font-bold">{`${count.toLocaleString()} ${capitalize(type)} Shown`}</span>
      )}
    </>
  );
};

export default FilterCounts;
