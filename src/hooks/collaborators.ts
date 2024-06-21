import { useEffect, useMemo, useState } from 'react';

import { Snackbar } from '@/components/Snackbar';
import { useAxios } from '@/hooks/useAxios';
import { useMy } from '@/hooks/useMy';
import { useAuth } from '@/state/auth';
import { Account, Statistics } from '@/types';
import { QueryStatus, useMergeStatus } from '@/utils/api';

interface Collaborator {
  email: string;
  displayName: string;
  counts?: Statistics;
}

interface CollaboratorProps {
  getRiskCounts?: boolean;
  doNotImpersonate?: boolean;
}

export function useGetCollaborators(props?: CollaboratorProps) {
  const { token } = useAuth();
  const axios = useAxios();

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [collaboratorsStatus, setCollaboratorsStatus] =
    useState<QueryStatus>('pending');

  const { data: accounts, status: accountsStatus } = useMy(
    {
      resource: 'account',
    },
    { doNotImpersonate: props?.doNotImpersonate }
  );

  const collaboratorEmails = useMemo(() => {
    return accountsStatus === 'success'
      ? accounts
          .filter(
            acc =>
              !acc.key.endsWith('#settings#') && acc?.member === acc?.username
          )
          .map(acc => acc.name)
      : [];
  }, [JSON.stringify(accounts), accountsStatus]);

  useEffect(() => {
    const fetchCollaboratorsOrgName = async () => {
      setCollaboratorsStatus('pending');

      const requests = collaboratorEmails.map(async email => {
        const promises = [];
        promises.push(
          axios({
            method: 'get',
            url: `/my?key=${encodeURIComponent('#account')}`,
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
              account: email,
            },
          }).then(response => response.data.accounts)
        );

        if (props?.getRiskCounts) {
          promises.push(
            axios({
              method: 'get',
              url: `/my/count?key=${encodeURIComponent('#risk')}`,
              headers: {
                Authorization: token ? `Bearer ${token}` : '',
                account: email,
              },
            }).then(response => response.data)
          );
        }

        const [accountResponse, risksResponse] = await Promise.all(promises);

        const friendSettings = accountResponse.find((account: Account) =>
          account.key.endsWith('#settings#')
        );

        return {
          displayName: friendSettings?.config?.displayName || '',
          email,
          counts: risksResponse,
        };
      });

      // Silence Error and display results that
      const results = await Promise.all(requests.map(p => p.catch(e => e)));
      const hasSomeError = results.find(r => r instanceof Error);

      setCollaborators(
        hasSomeError ? results.filter(s => s && !(s instanceof Error)) : results
      );

      if (hasSomeError) {
        Snackbar({
          variant: 'error',
          title: 'Failed to fetch some collaborators details',
          description: '',
        });
      }

      setCollaboratorsStatus('success');
    };

    if (collaboratorEmails.length > 0) {
      fetchCollaboratorsOrgName();
    } else {
      setCollaborators([]);
      setCollaboratorsStatus('success');
    }
  }, [JSON.stringify(collaboratorEmails), token]);

  return {
    data: collaborators,
    status: useMergeStatus(collaboratorsStatus, accountsStatus),
  };
}
