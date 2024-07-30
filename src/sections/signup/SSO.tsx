import { useEffect } from 'react';
import { signInWithRedirect } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

import { Button } from '@/components/Button';
import { Snackbar } from '@/components/Snackbar';

export const SSO = () => {
  useEffect(() => {
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect_failure') {
        Snackbar({
          title: 'An error has occurred during the OAuth flow.',
          description: '',
          variant: 'error',
        });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <div className="relative text-center">
        <hr className="absolute top-2.5 w-full border-t-2 border-default" />
        <span className="relative bg-layer0 px-8 text-center font-semibold">
          OR
        </span>
      </div>
      <Button
        className="w-full"
        styleType="secondary"
        onClick={() => signInWithRedirect({ provider: 'Google' })}
      >
        <img
          src="/icons/GoogleSSO.svg"
          alt="Google SSO"
          className="mr-2 size-5"
        />
        <span>Sign in with Google</span>
      </Button>
    </>
  );
};
