import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export const Empty = () => {
  return (
    <div className="mt-12 flex flex-col items-center justify-center">
      <QuestionMarkCircleIcon className="mb-4 size-16 text-gray-400" />
      <p className="text-2xl font-bold">Your search returned no results.</p>
    </div>
  );
};
