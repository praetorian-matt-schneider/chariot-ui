import React from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';

import { useAuth } from '@/state/auth';

const ImpersonationBanner: React.FC = () => {
  const { friend, stopImpersonation } = useAuth();

  if (friend?.email === '') {
    return null;
  }

  return (
    <div className="absolute top-0 flex w-full items-center bg-brand px-10 py-1 text-xs text-white">
      <button
        className="hover:bg-brand-hover mr-2 w-4 rounded text-center"
        onClick={stopImpersonation}
      >
        <XMarkIcon className="mr-2 size-4" />
      </button>
      <div>
        Viewing{' '}
        <span className="italic">
          {friend?.displayName?.length > 0 ? friend.displayName : friend.email}
        </span>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
