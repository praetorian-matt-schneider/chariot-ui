import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export const SignupError = ({ error }: { error?: string }) => {
  if (error) {
    return (
      <div className="flex items-center gap-2 rounded bg-yellow-100 p-2 text-xs text-yellow-600">
        <ExclamationCircleIcon className="inline size-4 text-yellow-700" />
        <span>{error}</span>
      </div>
    );
  }

  return null;
};
