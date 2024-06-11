import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/state/auth';

import { Account, Statistics } from '../types';

import { useAxios } from './useAxios';

interface RiskTracker {
  [email: string]: Statistics;
}

const useAccountDetails = (emails: string[]) => {
  const { token } = useAuth();
  const axios = useAxios();

  const [accountDetails, setAccountDetails] = useState<RiskTracker>({});
  const [loading, setLoading] = useState(true);
  const prevEmailsRef = useRef<string[]>([]);

  useEffect(() => {
    if (JSON.stringify(emails) === JSON.stringify(prevEmailsRef.current)) {
      return;
    }

    const fetchAccountDetails = async () => {
      try {
        const requests = emails.map(async email => {
          const accountResponse = await axios({
            method: 'get',
            url: '/my?key=%23account',
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
              account: email,
            },
          }).then(response => response.data.accounts);

          const friendSettings = accountResponse.find((account: Account) =>
            account.key.endsWith('#settings#')
          );

          return axios({
            method: 'get',
            url: '/my/count?key=%23risk',
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
              account: email,
            },
          }).then(response => ({
            displayName: friendSettings?.config?.displayName,
            email,
            data: response.data,
          }));
        });

        const results = await Promise.all(requests);

        const newAccountDetails = results.reduce(
          (acc, { email, displayName, data }) => {
            acc[email] = { ...data, displayName };
            return acc;
          },
          {} as RiskTracker
        );

        setAccountDetails(newAccountDetails);
      } finally {
        setLoading(false);
      }
    };

    if (emails.length > 0) {
      fetchAccountDetails();
      prevEmailsRef.current = emails;
    } else {
      setAccountDetails({});
      setLoading(false);
    }
  }, [emails, token, axios]);

  return { accountDetails, loading };
};

export default useAccountDetails;
