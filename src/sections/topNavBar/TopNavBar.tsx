import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { LogoIcon } from '@/components/icons/Logo.icon';
import MyInbox from '@/components/MyInbox';
import { AccountDropdown } from '@/sections/topNavBar/AccountDropdown';
import { Notifications } from '@/sections/topNavBar/Notifications';
import { cn } from '@/utils/classname';
import { getRoute } from '@/utils/route.util';

const LINK_CLASS = `mt-1 border-b-2 px-3 pb-1 text-sm font-medium capitalize transition-colors hover:text-gray-100`;

export const TopNavBar: React.FC = () => {
  const [, setShowNotification] = useState<boolean>(false);
  const location = useLocation();

  const currentPage = location.pathname.split('/').pop();
  const isCurrentPage = (page: string) => currentPage === page;

  const links = ['overview', 'assets'];

  // Function to keep the overview link as attack surface
  const remap = (link: string) =>
    link === 'overview' ? 'attack surface' : link;

  return (
    <div>
      <div className="flex flex-col items-center justify-between py-3 md:flex-row">
        <div className="flex w-full items-center">
          <div className="flex w-full flex-nowrap items-center">
            <Link to={getRoute(['app', 'overview'])}>
              <LogoIcon className="mr-4 size-9" />
            </Link>

            <nav className="flex w-full items-center space-x-6 text-center">
              {links.map(link => (
                <Link
                  key={link}
                  to={getRoute([
                    'app',
                    link as 'overview' | 'assets' | 'risks',
                  ])}
                  className={cn(
                    LINK_CLASS,
                    isCurrentPage(link)
                      ? 'border-layer0 hover:border-layer0'
                      : 'border-transparent hover:border-header'
                  )}
                >
                  {remap(link)}
                </Link>
              ))}
              <MyInbox
                className={cn(
                  LINK_CLASS,
                  isCurrentPage('risks')
                    ? 'border-layer0 hover:border-layer0'
                    : 'border-transparent hover:border-header'
                )}
              />
            </nav>

            <div className="ml-auto flex items-center md:space-x-4">
              <Notifications
                onNotify={shouldShow => {
                  setShowNotification(shouldShow);
                }}
                onClick={() => setShowNotification(false)}
              />

              <AccountDropdown />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
