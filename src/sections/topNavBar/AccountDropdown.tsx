import {
  ArrowRightStartOnRectangleIcon,
  ChartBarSquareIcon,
  DocumentTextIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

import { Dropdown } from '@/components/Dropdown';
import { Hexagon } from '@/components/Hexagon';
import { Tooltip } from '@/components/Tooltip';
import { useGetCollaborators } from '@/hooks/collaborators';
import { useGetDisplayName } from '@/hooks/useAccounts';
import { useMy } from '@/hooks/useMy';
import Avatar from '@/sections/topNavBar/Avatar';
import { useAuth } from '@/state/auth';
import { getAppRoute } from '@/utils/route.util';

export const AccountDropdown: React.FC = () => {
  const { impersonatingEmail, me, startImpersonation, stopImpersonation } =
    useAuth();

  const { data: accounts, status: accountsStatus } = useMy(
    {
      resource: 'account',
    },
    { doNotImpersonate: true }
  );

  const displayName = useGetDisplayName(accounts);
  const { data: collaborators, status: collaboratorsStatus } =
    useGetCollaborators({ doNotImpersonate: true });

  return (
    <Dropdown
      className="w-[50px] rounded-[2px] p-0 text-base"
      styleType="none"
      menu={{
        className: 'w-64',
        items: [
          {
            label: 'Organization Settings',
            icon: <UserIcon />,
            to: getAppRoute(['account']),
          },
          {
            label: 'Divider',
            type: 'divider',
          },
          {
            className: 'bg-layer2',
            isLoading:
              collaboratorsStatus === 'pending' || accountsStatus === 'pending',
            hide:
              collaboratorsStatus === 'error' ||
              (collaboratorsStatus === 'success' && collaborators.length === 0),
            label: displayName ? (
              <Tooltip title={me}>{displayName}</Tooltip>
            ) : (
              me
            ),
            icon: (
              <Avatar
                email={me}
                className="size-5 max-w-max scale-125 rounded-full"
              />
            ),
            value: displayName || me,
            onClick: () => impersonatingEmail && stopImpersonation(),
          },
          ...collaborators.map(collaborator => ({
            label: (
              <Tooltip title={collaborator.email}>
                <span className="overflow-hidden text-ellipsis text-nowrap">
                  {collaborator.displayName || collaborator.email}
                </span>
              </Tooltip>
            ),
            icon: (
              <Avatar
                email={String(collaborator.email)}
                className="size-5 max-w-max scale-125 rounded-full"
              />
            ),
            value: collaborator.email,
            onClick: () => startImpersonation(collaborator.email),
          })),
          {
            label: 'Divider',
            type: 'divider',
            hide: collaborators.length === 0,
          },
          {
            label: 'Documents',
            icon: <DocumentTextIcon />,
            to: getAppRoute(['files']),
          },
          {
            label: 'Widgets',
            icon: <ChartBarSquareIcon />,
            to: getAppRoute(['widgets']),
          },
          {
            label: 'Divider',
            type: 'divider',
          },
          {
            label: 'Log Out',
            icon: <ArrowRightStartOnRectangleIcon />,
            to: getAppRoute(['logout']),
          },
        ],
        value: impersonatingEmail || me,
      }}
    >
      <Hexagon>
        <Avatar className="scale-150" email={impersonatingEmail || me} />
      </Hexagon>
    </Dropdown>
  );
};
