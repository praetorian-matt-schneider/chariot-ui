import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

import { Dropdown } from '@/components/Dropdown';
import GlobalSearch from '@/components/GlobalSearch';
import { Hexagon } from '@/components/Hexagon';
import { AssetsIcon, RisksIcon, SeedsIcon } from '@/components/icons';
import { LogoIcon } from '@/components/icons/Logo.icon';
import { Shortcuts } from '@/components/ui/Shortcuts';
import { getRoute } from '@/utils/route.util';

import { AccountDropdown } from './AccountDropdown';
import { Notifications } from './Notifications';

export function TopNavBar() {
  const [showNotification, setShowNotification] = useState<boolean>(false);

  return (
    <div className="flex flex-col items-center justify-between py-3 md:flex-row">
      <div className="flex w-full items-center">
        <div className="flex w-full items-center">
          <Link to={getRoute(['app', 'risks'])}>
            <LogoIcon className="mr-4 size-9" />
          </Link>
          <Dropdown
            label="Attack Surface"
            styleType="none"
            endIcon={<ChevronDownIcon className="size-4 " />}
            menu={{
              className: 'w-96',
              items: [
                {
                  label: 'Seeds',
                  description:
                    'Starting point such as a domain or IP for monitoring and discovery.',
                  helpText: <Shortcuts value="S" />,
                  icon: <SeedsIcon />,
                  to: getRoute(['app', 'seeds']),
                },
                {
                  label: 'Assets',
                  description:
                    'Discovered resource from seeds, like servers, databases, and applications.',
                  helpText: <Shortcuts value="A" />,
                  icon: <AssetsIcon />,
                  to: getRoute(['app', 'assets']),
                },
                {
                  label: 'Risks',
                  description:
                    'Potential security threat or vulnerability identified within your assets.',
                  helpText: <Shortcuts value="R" />,
                  icon: <RisksIcon />,
                  to: getRoute(['app', 'risks']),
                },
              ],
            }}
          />
          <Link to={getRoute(['app', 'dashboard'])} className="ml-4 text-sm">
            Dashboard
          </Link>
          <div className="ml-auto flex items-center md:hidden">
            <Notifications />
            <AccountDropdown />
          </div>
        </div>
      </div>
      <div className="flex w-full items-center md:w-auto">
        <GlobalSearch />
        <div className="hidden items-center md:flex">
          <div className="ml-4">
            <Hexagon notify={showNotification}>
              <Notifications
                onNotify={shouldShow => {
                  setShowNotification(shouldShow);
                }}
                onClick={() => setShowNotification(false)}
              />
            </Hexagon>
          </div>
          <AccountDropdown />
        </div>
      </div>
    </div>
  );
}
