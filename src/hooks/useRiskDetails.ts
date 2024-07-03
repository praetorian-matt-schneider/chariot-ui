import { useAxios } from '@/hooks/useAxios';
import { useAuth } from '@/state/auth';

const useRiskDetails = () => {
  const { token } = useAuth();
  const axios = useAxios();

  const fetchRiskDetails = async (email: string): Promise<string> => {
    return await axios({
      method: 'get',
      url: '/risk/export',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        account: email,
      },
    })
      .then(
        async response =>
          await axios({
            method: 'get',
            url: '/file',
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
              account: email,
            },
            params: {
              name: response.data.file,
            },
            responseType: 'blob',
          })
      )
      .then(response => response.data);
  };

  return fetchRiskDetails;
};

export default useRiskDetails;
