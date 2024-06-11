import React, { useEffect, useState } from 'react';
import { UserIcon } from '@heroicons/react/24/solid';

import { useAuth } from '@/state/auth';

async function computeSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

interface Props {
  account?: string;
  className?: string;
}

const Avatar: React.FC<Props> = ({ account, className }: Props) => {
  const { me } = useAuth();
  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (account || me) {
      computeSHA256((account || me).trim().toLowerCase())
        .then(hash => {
          setGravatarUrl(`https://www.gravatar.com/avatar/${hash}?d=404`);
          setLoadError(false); // Reset error state upon new hash calculation
        })
        .catch(() => setLoadError(true)); // Handle any errors in hash computation
    }
  }, [account, me]);

  return (
    <>
      {gravatarUrl && !loadError ? (
        <img
          src={gravatarUrl}
          onError={() => setLoadError(true)}
          alt="User Avatar"
          className={className}
        />
      ) : (
        <div className="relative flex items-center justify-center rounded-[2px] text-sm font-medium text-default-light ring-inset focus:z-10 focus:outline-0 disabled:cursor-not-allowed disabled:bg-default-light disabled:text-default-light">
          <UserIcon className="size-5 text-lg" />
        </div>
      )}
    </>
  );
};

export default Avatar;
