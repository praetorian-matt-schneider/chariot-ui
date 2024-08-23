// eslint-disable-next-line no-restricted-imports
import { AxiosInstance } from 'axios';

import { useAxios } from '@/hooks/useAxios';
import { Account, Statistics } from '@/types';
import { useQueries } from '@/utils/api';

const fetchIntegrationCounts = async (
  axios: AxiosInstance,
  integration: Account
) => {
  try {
    const sourceKey = `#source##asset#${integration.member}#${integration.value}#asset`;
    const { data } = (await axios.get('/my/count', {
      params: {
        key: `#attribute${sourceKey}`,
      },
    })) as { data: Statistics };

    // Extract the asset count from the `attributes` field with the new key structure
    const assetCount = data.attributes ? data.attributes[sourceKey] || 0 : 0;
    return assetCount;
  } catch (error) {
    console.error(`Failed to fetch counts for ${integration.member}:`, error);
    return 0; // Return 0 in case of an error
  }
};

const useIntegrationCounts = (integrations: Account[]) => {
  const axios = useAxios();

  const queries = integrations.map(integration => ({
    queryKey: ['integrationCount', integration.member, integration.value],
    queryFn: () => fetchIntegrationCounts(axios, integration),
    enabled: !!integration.member,
  }));

  const results = useQueries({
    // defaultErrorMessage: 'Failed to fetch integration counts',
    queries,
  });

  return results;
};

export default useIntegrationCounts;
