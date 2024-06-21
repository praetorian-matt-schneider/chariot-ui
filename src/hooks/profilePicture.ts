import { AxiosHeaders } from 'axios';

import { useAxios } from '@/hooks/useAxios';
import { getQueryKey } from '@/hooks/useQueryKeys';
import { useAuth } from '@/state/auth';
import { UseExtendQueryOptions, useQuery } from '@/utils/api';

export const PROFILE_PICTURE_ID = '#profilePicture#';

async function computeSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}
interface GetProfilePictureUrl {
  email: string;
}

interface ProfilePictureUrl {
  url: string;
  isGavatar: boolean;
}

export function useGetProfilePictureUrl(
  props: GetProfilePictureUrl,
  options?: UseExtendQueryOptions<ProfilePictureUrl | null>
) {
  const { me } = useAuth();

  const axios = useAxios();

  return useQuery<ProfilePictureUrl | null>({
    ...options,
    defaultErrorMessage: 'Failed to fetch profile picture',
    queryKey: getQueryKey.getGavatarProfilePicture(props.email),
    queryFn: async () => {
      try {
        const res = await axios.get(`/file`, {
          params: {
            name: PROFILE_PICTURE_ID,
          },
          headers: {
            common: {
              account: props.email === me ? undefined : props.email,
            },
          } as unknown as AxiosHeaders,
        });

        const url = URL.createObjectURL(
          new Blob([res.data], { type: 'image/jpeg' })
        );
        console.log('url', url);

        return { url, isGavatar: false };
      } catch {
        console.log('failed');
        // ignore
      }

      const hash = await computeSHA256(props.email.trim().toLowerCase());
      const url = `https://www.gravatar.com/avatar/${hash}?d=404`;
      const isValid = await checkIsImageUrlValid(url);

      if (isValid) {
        return {
          url: `https://www.gravatar.com/avatar/${hash}?d=404`,
          isGavatar: true,
        };
      }

      return null;
    },
  });
}

async function checkIsImageUrlValid(url: string) {
  return new Promise(resolve => {
    const img = new Image();

    img.onload = function () {
      // Image loaded successfully
      resolve(true);
    };

    img.onerror = function () {
      // An error occurred while loading the image
      resolve(false);
    };

    img.src = url;
  });
}
