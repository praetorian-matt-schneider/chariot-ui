import { useState } from 'react';

import { EmailConfirmation } from '@/sections/signup/EmailConfirmation';
import { EmailPasswordForm } from '@/sections/signup/EmailPasswordForm';
import { ForgotPasswordSteps } from '@/sections/signup/ForgotPasswordSteps';
import { PageWrapper } from '@/sections/signup/PageWrapper';
import { cn } from '@/utils/classname';

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

export const Signup = ({
  onComplete,
  description,
}: {
  onComplete?: () => void;
  description?: React.ReactNode;
}) => {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
  }>({ username: '', password: '' });

  return (
    <PageWrapper title="Sign Up for a Free Account" description={description}>
      <div className="space-y-8">
        <div className="flex border-2 border-default">
          {[
            {
              title: 'Step One',
              description: 'Input Your Information',
            },
            {
              title: 'Step Two',
              description: 'Confirm Your Email',
            },
          ].map((step, currentIndex) => (
            <div
              className={cn(
                'grow px-4 py-2 cursor-pointer',
                currentIndex > 0 && 'border-0 border-l-2 border-default',
                currentIndex > stepIndex &&
                  'bg-layer1 text-default-light cursor-not-allowed'
              )}
              key={step.title}
              onClick={() =>
                currentIndex <= stepIndex ? setStepIndex(currentIndex) : null
              }
            >
              <h6
                className={cn(
                  'text-xs font-semibold text-brand',
                  stepIndex < currentIndex && 'text-default-light'
                )}
              >
                {step.title}
              </h6>
              <p className="text-sm font-bold text-current">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        <hr className="border-t-2 border-default" />
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
            onComplete={onComplete}
          />
        )}
      </div>
    </PageWrapper>
  );
};

export const ForgotPassword = () => {
  return (
    <PageWrapper
      title="Forgot your password?"
      description="Enter your Email below and we will send a message to reset your password"
    >
      <ForgotPasswordSteps />
    </PageWrapper>
  );
};
