import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Input } from '@/components/form/Input';
import { Inputs } from '@/components/form/Inputs';
import {
  isPasswordNotValid,
  PasswordRequirement,
} from '@/components/ui/PasswordRequirement';
import { Disclaimer } from '@/sections/signup/Disclaimer';
import { SignupError } from '@/sections/signup/SignupError';
import { SSO } from '@/sections/signup/SSO';
import { useAuth } from '@/state/auth';
import { getRoute } from '@/utils/route.util';
import { generatePathWithSearch } from '@/utils/url.util';

const UserLambdaValidationException =
  'PreSignUp failed with error email validation failed.';

export const EmailPasswordForm = ({
  onNext,
  isLogin = false,
}: {
  onNext?: () => void;
  isLogin?: boolean;
}) => {
  const {
    isLoading,
    login,
    signup,
    error,
    setError,
    credentials,
    setCredentials,
  } = useAuth();
  const { username, password } = credentials;
  const navigate = useNavigate();

  return (
    <form
      className="flex flex-1 flex-col gap-4 p-2 md:gap-6"
      id="signup"
      onSubmit={e => {
        e.preventDefault();
        isLogin && login(username, password);
        !isLogin && signup(username, password, onNext ? onNext : () => {});
      }}
    >
      <Inputs
        inputs={[
          {
            label: 'Business Email Address',
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
      {/* Regex satisfactions */}
      {!isLogin && <PasswordRequirement password={password} />}
      {/* Disable continue on Signup till all regex are satisfied */}
      <Button
        disabled={
          isLogin ? isLoading : isLoading || isPasswordNotValid({ password })
        }
        styleType="primary"
        className="w-full"
        type="submit"
        id="signup"
      >
        Continue
      </Button>
      <SignupError
        error={
          error && error === UserLambdaValidationException
            ? "Sign up failed. Please ensure you're using a business email address."
            : error
        }
      />
      {isLogin && (
        <div>
          <div className="flex flex-col justify-between md:flex-row">
            <div className="py-3 text-xs">
              <Button
                onClick={() =>
                  navigate(
                    generatePathWithSearch({
                      pathname: getRoute(['forgot-password']),
                    })
                  )
                }
                className="p-0 text-xs"
                styleType="textPrimary"
              >
                Forgot Password ?
              </Button>
            </div>
            <p className="text-xs">
              {`Need an account ? `}
              <Button
                onClick={() => {
                  setCredentials({ username: '', password: '' });
                  navigate(
                    generatePathWithSearch({ pathname: getRoute(['signup']) })
                  );
                }}
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
              onClick={() =>
                navigate(
                  generatePathWithSearch({ pathname: getRoute(['login-sso']) })
                )
              }
              className="text-xs"
              styleType="textPrimary"
            >
              Sign In
            </Button>
          </p>
        </div>
      )}
      <SSO />
      <Disclaimer />
    </form>
  );
};
