import { toast } from 'sonner';

import { useAxios } from '@/hooks/useAxios';
import { useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { useMy } from '@/hooks/useMy';
import { getQueryKey } from '@/hooks/useQueryKeys';
import { queryClient } from '@/queryclient';
import { Risk, RiskStatus, RiskTemplate } from '@/types';
import { useMutation } from '@/utils/api';
import { getRiskSeverity, getRiskStatus } from '@/utils/riskStatus.util';

export const useCreateRisk = () => {
  const axios = useAxios();
  const { updateAllSubQueries } = useMy(
    {
      resource: 'risk',
    },
    {
      enabled: false,
    }
  );

  return useMutation<Risk, Error, RiskTemplate>({
    defaultErrorMessage: `Failed to create risk`,
    mutationFn: async riskTemplate => {
      const promise = axios.post('/risk', riskTemplate);

      toast.promise(promise, {
        loading: 'Creating risk...',
        success: 'Risk created',
        error: 'Failed to create risk',
      });
      const { data } = await promise;
      const newRisk = data.risks[0];
      updateAllSubQueries(previous => {
        const newPages = previous ? [...previous.pages] : [];
        newPages[0] = { ...newPages[0], data: [newRisk, ...newPages[0].data] }; // Add the new risk to the first page

        return {
          pages: newPages,
          pageParams: [undefined],
        };
      });

      return newRisk;
    },
  });
};

interface RiskUpdate extends RiskTemplate {
  showSnackbar?: boolean;
}

export const useUpdateRisk = () => {
  const axios = useAxios();
  const { updateAllSubQueries } = useMy(
    {
      resource: 'risk',
    },
    {
      enabled: false,
    }
  );
  const { invalidate: invalidateAlerts } = useGetAccountAlerts({
    enabled: false,
  });

  return useMutation<Risk, Error, RiskUpdate>({
    defaultErrorMessage: `Failed to update risk`,
    mutationFn: async riskUpdate => {
      const { showSnackbar = true, ...riskTemplate } = riskUpdate;
      const promise = axios.put('/risk', riskTemplate);

      if (showSnackbar) {
        toast.promise(promise, {
          loading: 'Updating risk...',
          success: 'Risk updated',
          error: 'Failed to update risk',
        });
      }

      const { data } = await promise;
      const updatedRisk = data.risks[0];

      invalidateAlerts();
      queryClient.invalidateQueries({
        queryKey: getQueryKey.getCounts('risk'),
      });

      updateAllSubQueries(previous => {
        const updatedPages = previous.pages.map(page => {
          return {
            ...page,
            data: page.data.map(risk =>
              risk.key === updatedRisk.key ? updatedRisk : risk
            ),
          };
        });

        return { ...previous, pages: updatedPages };
      });

      return updatedRisk;
    },
  });
};

const useBulkUpdateRiskHook = () => {
  const axios = useAxios();
  const { updateAllSubQueries } = useMy(
    {
      resource: 'risk',
    },
    {
      enabled: false,
    }
  );
  const { invalidate: invalidateAlerts } = useGetAccountAlerts({
    enabled: false,
  });

  return useMutation<unknown, Error, RiskTemplate[]>({
    defaultErrorMessage: 'Failed to update risks',
    mutationFn: async (risks: RiskTemplate[]) => {
      const promise = Promise.all(
        risks
          .map(async risk => await axios.put(`/risk`, risk))
          // Note: Catch error so we can continue updating risk even if some fail
          .map(p => p.catch(e => e))
      );

      toast.promise(promise, {
        loading: 'Updating risks...',
        success: 'Risks updated',
        error: 'Failed to update risks',
      });
      const response = await promise;

      const validResults = response.filter(
        result => !(result instanceof Error)
      );

      if (validResults.length > 0) {
        const keys = risks.map(r => r.key);

        invalidateAlerts();

        updateAllSubQueries(previous => {
          const updatedPages = previous.pages.map(page => {
            return {
              ...page,
              data: page.data.map(risk =>
                keys.includes(risk.key)
                  ? {
                      ...risk,
                      ...risks.find(r => r.key === risk.key),
                    }
                  : risk
              ),
            };
          });

          return { ...previous, pages: updatedPages };
        });
      }

      if (validResults.length !== risks.length) {
        const firstError = response.find(result => result instanceof Error);

        throw firstError;
      }

      return;
    },
  });
};

export function useBulkUpdateRisk() {
  const { mutate: updateRisk, status } = useBulkUpdateRiskHook();

  function handleUpdate({
    selectedRows,
    status,
    severity,
    comment: newComment,
  }: {
    selectedRows: Risk[];
    status?: RiskStatus;
    severity?: string;
    comment?: string;
  }) {
    return updateRisk(
      selectedRows.map(item => {
        const riskComposite = item.key.split('#');
        const finding = riskComposite[3];
        let newStatus = item.status;
        const oldSeverity = getRiskSeverity(item.status);
        const oldStatus = getRiskStatus(item.status);
        if (status) {
          newStatus = `${status}${oldSeverity}`;
        }
        if (severity) {
          newStatus = `${oldStatus}${severity}`;
        }
        return {
          key: item.key,
          name: finding,
          status: newStatus,
          comment: newComment || item.comment,
        };
      })
    );
  }

  return { handleUpdate, status };
}

export function useDeleteRisk() {
  const axios = useAxios();
  const { updateAllSubQueries } = useMy(
    {
      resource: 'risk',
    },
    {
      enabled: false,
    }
  );

  return useMutation<unknown, Error, { key: string }[]>({
    defaultErrorMessage: `Failed to close risks`,
    mutationFn: async selectedRows => {
      const promises = selectedRows.map(({ key }) => {
        return axios.delete(`/risk`, {
          data: { key }, // Send the key as part of the request body
        });
      });

      const promise = Promise.all(
        promises.map(p => p.catch(e => e)) // Catch errors to continue deleting
      );

      toast.promise(promise, {
        loading: 'Closing risks...',
        success: 'Risks Closed',
        error: 'Failed to close risks',
      });

      const response = await promise;
      const validResults = response.filter(
        result => !(result instanceof Error)
      );

      if (validResults.length > 0) {
        updateAllSubQueries(previous => {
          const updatedPages = previous.pages.map(page => {
            return {
              ...page,
              data: page.data.filter(
                risk => !selectedRows.some(row => row.key === risk.key)
              ),
            };
          });

          return { ...previous, pages: updatedPages };
        });
      }

      if (validResults.length !== selectedRows.length) {
        const firstError = response.find(result => result instanceof Error);
        throw firstError;
      }

      return;
    },
  });
}

interface ReportRiskProps {
  name: string;
}

export function useReportRisk() {
  const axios = useAxios();

  return useMutation<unknown, Error, ReportRiskProps>({
    defaultErrorMessage: `Failed to generate risk report`,
    mutationFn: async props => {
      const res = await axios.get('/report/risk', {
        params: {
          name: props.name,
        },
      });

      return res;
    },
    onSuccess: (_, props) => {
      queryClient.invalidateQueries({
        queryKey: getQueryKey.getFile({ name: `definitions/${props.name}` }),
      });
    },
  });
}
