import { Dispatch, SetStateAction, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp } from 'aws-amplify/auth';

import { Button } from '@/components/Button';
import { Input } from '@/components/form/Input';
import { Inputs } from '@/components/form/Inputs';
import { Disclaimer } from '@/sections/signup/Disclaimer';
import { SignupError } from '@/sections/signup/SignupError';
import { SSO } from '@/sections/signup/SSO';
import { useAuth } from '@/state/auth';
import { getRoute } from '@/utils/route.util';

interface Credentials {
  username: string;
  password: string;
}

export const EmailPasswordForm = ({
  credentials,
  setCredentials,
  onNext,
  isLogin = false,
}: {
  credentials: Credentials;
  setCredentials: Dispatch<SetStateAction<Credentials>>;
  onNext?: () => void;
  isLogin?: boolean;
}) => {
  const { username, password } = credentials;
  const navigate = useNavigate();
  const { isLoading, login, error, setError } = useAuth();
  const [isLoadingSignup, setIsLoadingSignup] = useState(false);

  async function signup() {
    try {
      setIsLoadingSignup(true);
      const { isSignUpComplete, nextStep } = await signUp({
        username,
        password,
      });
      const { signUpStep } = nextStep;
      if (!isSignUpComplete && signUpStep === 'CONFIRM_SIGN_UP' && onNext) {
        onNext();
      }
    } catch (error) {
      error instanceof Error && error.message && setError(error.message);
    } finally {
      setIsLoadingSignup(false);
    }
  }

  return (
    <form
      className="flex flex-1 flex-col gap-4 space-y-4 p-2"
      id="signup"
      onSubmit={e => {
        e.preventDefault();
        isLogin && login(username, password);
        !isLogin && signup();
      }}
    >
      <Inputs
        inputs={[
          {
            label: 'Email Address',
            value: credentials.username,
            placeholder: 'janelongestname@praetorian.com',
            name: 'username',
            required: true,
          },
          {
            label: 'Password',
            value: credentials.password || '',
            placeholder: '**************',
            name: 'password',
            type: Input.Type.PASSWORD,
            required: true,
          },
        ]}
        onChange={values => {
          setError('');
          setCredentials(auth => ({ ...auth, ...values }));
        }}
      />
      <Button
        disabled={isLoading || isLoadingSignup}
        styleType="primary"
        className="w-full"
        type="submit"
        id="signup"
      >
        Continue
      </Button>
      <SignupError error={error} />
      {isLogin && (
        <div>
          <div className="flex justify-between">
            <div className="py-3 text-xs">
              <Button
                onClick={() => navigate(getRoute(['forgot-password']))}
                className="p-0 text-xs"
                styleType="textPrimary"
              >
                Forgot Password ?
              </Button>
            </div>
            <p className="text-xs">
              {`Need an account ? `}
              <Button
                onClick={() => navigate(getRoute(['signup']))}
                className="text-xs"
                styleType="textPrimary"
              >
                Sign Up
              </Button>
            </p>
          </div>
          <p className="text-xs">
            {`SSO user ? `}
            <Button
              onClick={() => navigate(getRoute(['login-sso']))}
              className="text-xs"
              styleType="textPrimary"
            >
              Sign In
            </Button>
          </p>
        </div>
      )}
      {!isLogin && (
        <p className="text-xs">
          {`Already have an account ? `}
          <Button
            onClick={() => navigate(getRoute(['login']))}
            className="text-xs"
            styleType="textPrimary"
          >
            Sign In
          </Button>
        </p>
      )}
      <SSO />
      <Disclaimer />
    </form>
  );
};
