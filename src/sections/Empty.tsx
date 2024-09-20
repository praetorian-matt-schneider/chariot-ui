import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Inbox } from 'lucide-react';

import { RiskFilters } from '@/types';
import { useQueryFilters } from '@/utils/storage/useQueryParams.util';
import { StorageKey } from '@/utils/storage/useStorage.util';

export const Empty = () => {
  const [filters] = useQueryFilters<RiskFilters>({
    key: StorageKey.RISK_FILTERS,
    defaultFilters: {
      search: '',
      query: '',
    },
  });

  return filters.search?.length === 0 ? (
    <div className="flex flex-col items-center justify-center bg-white py-12 text-center">
      <Inbox className="size-16 text-gray-400" />
      <h2 className="mt-4 text-2xl font-bold">All Clear!</h2>
      <p className="text-md mt-2 text-gray-600">
        Great job! No risks have been detected in your environment.
        <br /> Keep monitoring to stay secure.
      </p>
    </div>
  ) : (
    <div className="mt-12 flex flex-col items-center justify-center">
      <QuestionMarkCircleIcon className="mb-4 size-16 text-gray-400" />
      <p className="text-2xl font-bold">Your search returned no results.</p>
    </div>
  );
};
