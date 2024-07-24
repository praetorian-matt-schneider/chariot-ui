import { useState } from 'react';

import { EmailConfirmation } from '@/sections/signup/EmailConfirmation';
import { EmailPasswordForm } from '@/sections/signup/EmailPasswordForm';
import { PageWrapper } from '@/sections/signup/PageWrapper';
import { Steps } from '@/sections/signup/Steps';

export const Login = () => {
  return (
    <PageWrapper title="Sign in with your email and password">
      <EmailPasswordForm />
    </PageWrapper>
  );
};

export const Signup = () => {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <PageWrapper title="Sign Up for a Free Account">
      <Steps
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        steps={[
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
        ]}
      />
    </PageWrapper>
  );
};
