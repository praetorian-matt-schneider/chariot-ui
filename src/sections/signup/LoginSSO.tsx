import { useState } from 'react';
import { signInWithRedirect } from 'aws-amplify/auth';

import { Button } from '@/components/Button';
import { Input } from '@/components/form/Input';
import { Disclaimer } from '@/sections/signup/Disclaimer';
import { PageWrapper } from '@/sections/signup/PageWrapper';

export const LoginSSO = () => {
  const [username, setUsername] = useState<string>('');

  const handleSignin = async () => {
    await signInWithRedirect({
      provider: {
        custom: username.split('@')[1],
      },
    });
  };

  return (
    <PageWrapper title="Sign in with SSO" showBack={true}>
      <form
        className="flex flex-1 flex-col gap-4 space-y-4 p-2"
        id="signup"
        onSubmit={e => {
          e.preventDefault();
          handleSignin();
        }}
      >
        <Input
          label={'Email Address'}
          value={username}
          placeholder={'janelongestname@praetorian.com'}
          name={'username'}
          required={true}
          onChange={e => {
            setUsername(e.target.value);
          }}
        />
        <Button
          styleType="primary"
          className="w-full"
          type="submit"
          id="signup"
        >
          Continue
        </Button>
        <Disclaimer />
      </form>
    </PageWrapper>
  );
};
