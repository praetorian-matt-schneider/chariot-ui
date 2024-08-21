import { EmailConfirmation } from '@/sections/signup/EmailConfirmation';
import { EmailPasswordForm } from '@/sections/signup/EmailPasswordForm';
import { ForgotPasswordSteps } from '@/sections/signup/ForgotPasswordSteps';
import { PageWrapper } from '@/sections/signup/PageWrapper';
import { useAuth } from '@/state/auth';

export const Login = () => {
  return (
    <PageWrapper title="Sign in with your email and password">
      <EmailPasswordForm isLogin={true} />
    </PageWrapper>
  );
};

export const Signup = ({ description }: { description?: React.ReactNode }) => {
  const { signupStepIndex, setSignupStepIndex } = useAuth();

  return (
    <PageWrapper title="Sign Up" description={description} showBack={true}>
      <i className="text-sm"> Step {signupStepIndex + 1} of 2</i>
      {signupStepIndex === 0 ? (
        <EmailPasswordForm
          onNext={() => setSignupStepIndex(step => step + 1)}
        />
      ) : (
        <EmailConfirmation />
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
