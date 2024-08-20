import { useState } from 'react';

import { EmailConfirmation } from '@/sections/signup/EmailConfirmation';
import { EmailPasswordForm } from '@/sections/signup/EmailPasswordForm';
import { ForgotPasswordSteps } from '@/sections/signup/ForgotPasswordSteps';
import { PageWrapper } from '@/sections/signup/PageWrapper';

export const Login = () => {
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
  }>({ username: '', password: '' });

  return (
    <PageWrapper title="Sign in with your email and password">
      <EmailPasswordForm
        isLogin={true}
        credentials={credentials}
        setCredentials={setCredentials}
      />
    </PageWrapper>
  );
};

export const Signup = ({ description }: { description?: React.ReactNode }) => {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
  }>({ username: '', password: '' });

  return (
    <PageWrapper title="Sign Up" description={description} showBack={true}>
      <i className="text-sm"> Step {stepIndex + 1} of 2</i>
      {stepIndex === 0 ? (
        <EmailPasswordForm
          credentials={credentials}
          setCredentials={setCredentials}
          onNext={() => setStepIndex(step => step + 1)}
        />
      ) : (
        <EmailConfirmation
          username={credentials.username}
          password={credentials.password}
        />
      )}
    </PageWrapper>
  );
};

export const ForgotPassword = () => {
  return (
    <PageWrapper
      title="Forgot your password?"
      description="Enter your Email below and we will send a message to reset your password"
      showBack={true}
    >
      <ForgotPasswordSteps />
    </PageWrapper>
  );
};
