import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmResetPassword, resetPassword } from 'aws-amplify/auth';

import { Button } from '@/components/Button';
import { Input } from '@/components/form/Input';
import { Inputs } from '@/components/form/Inputs';
import {
  isPasswordNotValid,
  PasswordRequirement,
} from '@/components/ui/PasswordRequirement';
import { Disclaimer } from '@/sections/signup/Disclaimer';
import { SignupError } from '@/sections/signup/SignupError';
import { getRoute } from '@/utils/route.util';
import { generatePathWithSearch } from '@/utils/url.util';

export const ForgotPasswordSteps = () => {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [username, setUsername] = useState<string>('');
  const [forgotPasswordForm, setForgotPasswordForm] = useState<{
    code: string;
    password: string;
    passwordAgain: string;
  }>({
    code: '',
    password: '',
    passwordAgain: '',
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (forgotPasswordForm.password !== forgotPasswordForm.passwordAgain) {
      setError('Passwords do not match');
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [forgotPasswordForm.password, forgotPasswordForm.passwordAgain]);

  async function handleResetPassword() {
    try {
      setIsLoading(true);
      const output = await resetPassword({ username });
      if (
        output.nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE'
      ) {
        setStepIndex(stepIndex => stepIndex + 1);
      }
    } catch (error) {
      error instanceof Error
        ? setError(error.message)
        : setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmResetPassword() {
    try {
      setIsLoading(true);
      await confirmResetPassword({
        username: username,
        confirmationCode: forgotPasswordForm.code,
        newPassword: forgotPasswordForm.password,
      });
      navigate(getRoute(['login']));
    } catch (error) {
      error instanceof Error
        ? setError(error.message)
        : setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <i className="text-sm"> Step {stepIndex + 1} of 2</i>
      {stepIndex === 0 ? (
        <form
          className="flex flex-1 flex-col gap-4 p-2"
          id="signup"
          onSubmit={e => {
            e.preventDefault();
            handleResetPassword();
          }}
        >
          <Input
            label={'Email Address'}
            value={username}
            placeholder="janelongestname@praetorian.com"
            name={'username'}
            required={true}
            onChange={e => {
              setError('');
              setUsername(e.target.value);
            }}
          />
          <Button
            disabled={isLoading}
            styleType="primary"
            className="w-full"
            type="submit"
            id="signup"
          >
            Continue
          </Button>
          <SignupError error={error} />

          <Button
            onClick={() => {
              navigate(
                generatePathWithSearch({ pathname: getRoute(['signup']) })
              );
            }}
            className="text-md mr-auto p-0"
            styleType="textPrimary"
          >
            Sign Up
          </Button>
          <Disclaimer />
        </form>
      ) : (
        <div className="text-sm text-default-light">
          <p className="mb-4">
            We have sent a password reset code by email to {username}. Enter it
            below to reset your password.
          </p>
          <form
            id="forgot-password"
            className="flex flex-1 flex-col gap-4 space-y-4"
          >
            <Inputs
              inputs={[
                {
                  label: 'Code',
                  value: forgotPasswordForm.code,
                  placeholder: '',
                  name: 'code',
                  required: true,
                },
                {
                  label: 'New Password',
                  value: forgotPasswordForm.password,
                  placeholder: '**************',
                  name: 'password',
                  type: Input.Type.PASSWORD,
                  required: true,
                },
                {
                  label: 'Enter New Password Again',
                  value: forgotPasswordForm.passwordAgain,
                  placeholder: '**************',
                  name: 'passwordAgain',
                  type: Input.Type.PASSWORD,
                  required: true,
                },
              ]}
              onChange={values => {
                setError('');
                setForgotPasswordForm(credentials => ({
                  ...credentials,
                  ...values,
                }));
              }}
            />
            <PasswordRequirement password={forgotPasswordForm.password} />
            <SignupError error={error} />
            <Button
              disabled={
                isLoading ||
                isPasswordNotValid({ password: forgotPasswordForm.password })
              }
              styleType="primary"
              className="w-full"
              type="submit"
              id="forgot-password"
              onClick={handleConfirmResetPassword}
            >
              Change Password
            </Button>
          </form>
        </div>
      )}
    </>
  );
};
