import { Dispatch, SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

import { Button } from '@/components/Button';
import { Input } from '@/components/form/Input';
import { Inputs } from '@/components/form/Inputs';
import { Disclaimer } from '@/sections/signup/Disclaimer';
import { SignupError } from '@/sections/signup/SignupError';
import { SSO } from '@/sections/signup/SSO';
import { useAuth } from '@/state/auth';
import { cn } from '@/utils/classname';
import { Regex } from '@/utils/regex.util';
import { getRoute } from '@/utils/route.util';
import { generatePathWithSearch } from '@/utils/url.util';

interface Credentials {
  username: string;
  password: string;
}

const UserLambdaValidationException =
  'PreSignUp failed with error email validation failed.';

const PasswordRequirements = [
  {
    label: 'At least 8 characters',
    regex: Regex.PASSWORD.CHARACTERS_LENGTH,
  },
  {
    label: 'At least 1 uppercase letter',
    regex: Regex.PASSWORD.UPPER_CASE,
  },
  {
    label: 'At least 1 lowercase letter',
    regex: Regex.PASSWORD.LOWER_CASE,
  },
  {
    label: 'At least 1 number',
    regex: Regex.PASSWORD.NUMERIC_CHARACTERS,
  },
  {
    label: 'At least 1 special character without space',
    regex: Regex.PASSWORD.SPECIAL_CHARACTERS_WITHOUT_SPACE,
  },
];

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
  const { isLoading, login, signup, error, setError } = useAuth();

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
      {!isLogin && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-default-dark">
            Password Requirements
          </h3>
          <div className="grid grid-cols-1 gap-x-4 lg:grid-cols-2">
            {PasswordRequirements.map(({ label, regex }) => (
              <div
                className="flex gap-2 text-sm"
                key={label.split(' ').join('_')}
              >
                <CheckCircleIcon
                  className={cn(
                    'size-5',
                    regex.exec(password)
                      ? 'text-green-500'
                      : 'text-default-light'
                  )}
                />
                <p>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Disable continue on Signup till all regex are satisfied */}
      <Button
        disabled={
          isLogin
            ? isLoading
            : isLoading ||
              [...PasswordRequirements].some(
                ({ regex }) => !regex.exec(password)
              )
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
                onClick={() =>
                  navigate(
                    generatePathWithSearch({ pathname: getRoute(['signup']) })
                  )
                }
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
