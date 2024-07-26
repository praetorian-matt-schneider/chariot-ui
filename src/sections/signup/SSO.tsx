import { signInWithRedirect } from 'aws-amplify/auth';

import { Button } from '@/components/Button';

export const SSO = () => {
  return (
    <>
      <div className="relative text-center">
        <hr className="absolute top-2.5 w-full border-t-2 border-default" />
        <span className="relative bg-layer0 px-8 text-center font-semibold">
          OR
        </span>
      </div>
      <Button
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
