import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { EmailConfirmation } from '@/sections/signup/EmailConfirmation';
import { EmailPasswordForm } from '@/sections/signup/EmailPasswordForm';
import { PageWrapper } from '@/sections/signup/PageWrapper';
import { cn } from '@/utils/classname';

export const Login = () => {
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState<number>(0);

  if (location.pathname.includes('login')) {
    return (
      <PageWrapper title="Sign in with your email and password">
        <EmailPasswordForm />
      </PageWrapper>
    );
  }

  // Signup flow
  return (
    <PageWrapper title="Sign Up for a Free Account">
      <div className="space-y-8">
        <div className="flex border-2 border-default">
          {[
            {
              title: 'Step One',
              description: 'Input Your Information',
              Content: EmailPasswordForm,
            },
            {
              title: 'Step Two',
              description: 'Confirm Your Email',
              Content: EmailConfirmation,
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
          <EmailPasswordForm onNext={() => setStepIndex(step => step + 1)} />
        ) : (
          <EmailConfirmation />
        )}
      </div>
    </PageWrapper>
  );
};
