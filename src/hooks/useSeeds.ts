import { Snackbar } from '@/components/Snackbar';
import { queryClient } from '@/queryclient';
import { useAuth } from '@/state/auth';
import { useMutation } from '@/utils/api';

import { Seed, SeedStatus } from '../types';

import { useAxios } from './useAxios';
import { useMy } from './useMy';

interface NewSeed {
  asset: string;
  toastId?: string;
  seedsCount?: number;
}

interface InfiniteQueryData {
  pages: Seed[][];
  pageParams: unknown[];
}

const stopMessage = 'Risk scanning will stop.';
const startMessage = 'Risk scanning will start automatically.';

export const create = () => {
  const axios = useAxios();
  const queryKey = ['MY', 'seed'];
  const { invalidate: invalidateJob } = useMy(
    { resource: 'job' },
    { enabled: false }
  );

  return useMutation<Seed, Error, NewSeed>({
    defaultErrorMessage: `Failed to create seed`,
    mutationFn: async (seed: NewSeed) => {
      const { seedsCount = 1 } = seed;
      try {
        const { data } = await axios.post(`/seed`, {
          dns: seed.asset,
          status: SeedStatus.Active,
        });

        Snackbar({
          title:
            seedsCount > 1
              ? `Added ${seedsCount} seeds`
              : `${seed.asset} added`,
          description: startMessage,
          variant: 'success',
          toastId: seed?.toastId,
        });

        invalidateJob();

        queryClient.setQueryData<InfiniteQueryData>(queryKey, previous => {
          // If there's no previous data, initialize with the new seed
          if (!previous) {
            return { pages: [[...data]], pageParams: [] };
          }

          const updatedPages = previous.pages.map((page, index) =>
            index === 0 ? [...data, ...page] : page
          );
          return { ...previous, pages: updatedPages };
        });

        return data;
      } catch (error) {
        Snackbar({
          title: 'Error',
          description: `Failed to add ${seedsCount > 1 ? `${seedsCount} seeds` : seed.asset} due to an error. Please try again.`,
          variant: 'error',
          toastId: seed?.toastId,
        });
        throw error;
      }
    },
  });
};

interface ChangeStatus {
  key: string;
  status?: SeedStatus;
  comment?: string;
  showSnackbar?: boolean;
}
export const change = () => {
  const axios = useAxios();
  const { me } = useAuth();

  const { updateAllSubQueries } = useMy(
    {
      resource: 'seed',
    },
    {
      enabled: false,
    }
  );

  return useMutation<Seed, Error, ChangeStatus>({
    defaultErrorMessage: `Failed to update seed`,
    mutationFn: async ({ key, status, comment, showSnackbar = true }) => {
      const seed = key.split('#seed#')[1];
      const response = await axios.put(`/seed`, {
        key,
        status,
        comment,
      });

      const data = response.data?.[0] as Seed;

      if (!data.username) {
        data.username = me;
      }

      if (status && showSnackbar) {
        Snackbar({
          title: `${seed} ${status === SeedStatus.Frozen ? 'will be removed' : 'will resume scanning'}`,
          description:
            status === SeedStatus.Frozen ? stopMessage : startMessage,
          variant: 'success',
        });
      } else if (comment && showSnackbar) {
        Snackbar({
          title: `${seed} comment updated`,
          description: '',
          variant: 'success',
        });
      }

      updateAllSubQueries(previous => {
        if (!previous) {
          return { pages: [[data]], pageParams: [undefined] };
        }
        const updatedPages = previous.pages.map(page =>
          page.map(currentSeed =>
            currentSeed.key === key
              ? {
                  ...currentSeed,
                  ...data,
                  username: data.username || me,
                }
              : currentSeed
          )
        );
        return { ...previous, pages: updatedPages };
      });

      return data;
    },
  });
};

export function useDeleteSeed() {
  const axios = useAxios();
  const { updateAllSubQueries } = useMy(
    {
      resource: 'seed',
    },
    {
      enabled: false,
    }
  );

  return useMutation<void, Error, { seed: string; showSnackbar?: boolean }>({
    defaultErrorMessage: `Failed to delete seed`,
    mutationFn: async ({ seed }) => {
      await axios.delete(`/seed`, {
        data: {
          key: `#seed#${seed}`,
        },
      });
    },
    onSuccess: (_, { seed, showSnackbar = true }) => {
      showSnackbar &&
        Snackbar({
          title: `Seed ${seed} removed`,
          description: '',
          variant: 'success',
        });

      updateAllSubQueries(previous => {
        if (previous) {
          return {
            ...previous,
            pages: previous.pages.map(page =>
              page.filter(item => item.dns !== seed)
            ),
          };
        }
        return previous;
      });
    },
  });
}
