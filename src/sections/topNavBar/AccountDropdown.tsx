import { useMemo } from 'react';
import {
  ArrowRightCircleIcon,
  DocumentTextIcon,
  PuzzlePieceIcon,
  UserIcon,
} from '@heroicons/react/24/solid';

import { Dropdown } from '@/components/Dropdown';
import Hexagon from '@/components/Hexagon';
import { MenuItemProps } from '@/components/Menu';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useAuth } from '@/state/auth';
import { getRoute } from '@/utils/route.util';

import Avatar from './Avatar';

export const AccountDropdown: React.FC = () => {
  const { friend, me, startImpersonation, stopImpersonation } = useAuth();
  const { data: dataGenericSearch } = useGenericSearch({
    query: '#account',
    headers: {
      common: {
        account: undefined,
      },
    },
  });
  const data = dataGenericSearch?.accounts;

  const collaborators = useMemo(
    () =>
      data
        ?.filter(
          acc =>
            !acc.key.endsWith('#settings#') && acc?.member === acc?.username
        )
        .map(acc => ({
          email: acc.name,
          displayName: acc?.config?.displayName ?? acc.name,
        })) || [],
    [data]
  );

  return (
    <Dropdown
      className="w-[50px] rounded-[2px] p-0 text-base"
      styleType="none"
      menu={{
        className: 'w-64',
        items: [
          {
            label: 'Integrations',
            icon: <PuzzlePieceIcon />,
            to: getRoute(['app', 'integrations']),
          },
          {
            label: 'Documents',
            icon: <DocumentTextIcon />,
            to: getRoute(['app', 'files']),
          },
          {
            label: 'Divider',
            type: 'divider',
          },
          {
            label: 'Organization Settings',
            icon: <UserIcon />,
            to: getRoute(['app', 'account']),
          },
          {
            label: 'Divider',
            type: 'divider',
          },
          ...(collaborators.length > 0
            ? [
                {
                  label: me,
                  icon: (
                    <Avatar
                      account={me}
                      className="size-5 max-w-max scale-125 rounded-full"
                    />
                  ),
                  onClick: () => friend?.email && stopImpersonation(),
                  checked: !friend?.email,
                },
              ]
            : []),
          ...collaborators.map(collaborator => ({
            label: collaborator.displayName,
            icon: (
              <Avatar
                account={String(collaborator.email)}
                className="size-5 max-w-max scale-125 rounded-full"
              />
            ),
            checked: friend?.email
              ? friend?.email === collaborator.email
              : collaborator.email === me,
            onClick: () =>
              startImpersonation(
                collaborator.email,
                collaborator.displayName ?? ''
              ),
          })),
          ...(collaborators.length > 0
            ? [{ label: 'Divider', type: 'divider' } as MenuItemProps]
            : []),
          {
            label: 'Log Out',
            icon: <ArrowRightCircleIcon />,
            to: getRoute(['app', 'logout']),
          },
        ],
      }}
    >
      <Hexagon>
        <Avatar className="scale-150" account={friend.email || me} />
      </Hexagon>
    </Dropdown>
  );
};
