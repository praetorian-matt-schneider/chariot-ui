import React, { useEffect, useRef } from 'react';
import { Bars3Icon } from '@heroicons/react/20/solid';
import { XMarkIcon } from '@heroicons/react/24/solid';

import { Tooltip } from '@/components/Tooltip';
import { useGetDisplayName } from '@/hooks/useAccounts';
import { useMy } from '@/hooks/useMy';
import { useAuth } from '@/state/auth';
import { useStorage } from '@/utils/storage/useStorage.util';

const ImpersonationBanner: React.FC = () => {
  const { stopImpersonation, impersonatingEmail } = useAuth();
  const [position, setPosition] = useStorage(
    { key: 'impersonationPosition' },
    {
      x: -500, // Default to -500 initially; this will be updated on mount
      y: 0,
    }
  );

  const { data: accounts, status: accountsStatus } = useMy(
    {
      resource: 'account',
    },
    { enabled: Boolean(impersonatingEmail) }
  );

  const displayName = useGetDisplayName(accounts);

  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const banner = bannerRef.current;
    if (banner && position.x === -500) {
      const screenWidth = window.innerWidth;
      const bannerWidth = banner.offsetWidth;
      const centerPositionX = (screenWidth - bannerWidth) / 2;
      setPosition({ ...position, x: centerPositionX });
    }
  }, [setPosition, bannerRef.current]);

  if (!impersonatingEmail || accountsStatus === 'pending') {
    return null;
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    const startX = event.clientX;
    const startPos = { ...position };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = startPos.x + moveEvent.clientX - startX;
      const banner = bannerRef.current;
      const screenWidth = window.innerWidth;

      if (banner) {
        const bannerWidth = banner.offsetWidth;

        setPosition({
          x: Math.max(0, Math.min(newX, screenWidth - bannerWidth)),
          y: 0,
        });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={bannerRef}
      className="fixed top-0 z-[99999] flex items-center rounded-b-[2px] bg-brand px-4 py-1 text-xs text-white shadow-lg"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <button
        className="mr-2 rounded-b-[4px] p-1 text-center hover:bg-brand-dark"
        onClick={stopImpersonation}
      >
        <XMarkIcon className="size-4" />
      </button>
      <span className="text-nowrap">Viewing:</span>
      <span className="ml-1 font-semibold">
        {displayName ? (
          <Tooltip placement="bottom" title={impersonatingEmail}>
            {displayName}
          </Tooltip>
        ) : (
          impersonatingEmail
        )}
      </span>
      <div
        className="ml-2 cursor-move rounded-b-[4px] p-1 hover:bg-brand-dark "
        onMouseDown={handleMouseDown}
      >
        <span className="text-lg">
          <Bars3Icon className="size-4" />
        </span>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
