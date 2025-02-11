import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithRedirect } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { toast } from 'sonner';

import { Button } from '@/components/Button';
import { getRoute } from '@/utils/route.util';
import { generatePathWithSearch } from '@/utils/url.util';

export const SSO = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect_failure') {
        toast.error('An error has occurred during the OAuth flow.');
      }
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <div className="relative w-full text-center">
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
      <Button
        className="w-full"
        styleType="secondary"
        onClick={() =>
          navigate(
            generatePathWithSearch({ pathname: getRoute(['login-sso']) })
          )
        }
      >
        Sign in with SSO
      </Button>
    </>
  );
};
