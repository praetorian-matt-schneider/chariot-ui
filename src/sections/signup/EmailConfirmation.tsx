import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { resendSignUpCode } from 'aws-amplify/auth';

import { Button } from '@/components/Button';
import { ModalWrapper } from '@/components/Modal';
import { OTPInput } from '@/sections/signup/OTPInput';
import { SSO } from '@/sections/signup/SSO';
import { useAuth } from '@/state/auth';

export const EmailConfirmation = () => {
  const { confirmOTP, isLoading, credentials } = useAuth();
  const { username, password } = credentials;
  const [open, setOpen] = useState(true);

  async function resendEmail() {
    await resendSignUpCode({
      username,
    });
    setOpen(true);
  }

  async function confirmOtpFn(otp: string) {
    await confirmOTP(username, password, otp);
  }

  return (
    <>
      <div className="text-sm text-default-light">
        <p>
          An email was sent to{' '}
          <span className="font-bold text-default">{username}</span>
          <Button
            className="inline p-0 pl-2"
            styleType="textPrimary"
            onClick={() => setOpen(true)}
          >
            Re-enter Code
          </Button>
        </p>
        <ul className="mt-4 list-inside list-disc">
          <li>{`Can't find it? Don't forget to check your spam box.`}</li>
          <li>
            {`If it's not received within 10 minutes, feel free to  `}
            <Button
              className="inline p-0"
              styleType="textPrimary"
              onClick={resendEmail}
            >
              send it again.
            </Button>
          </li>
        </ul>
      </div>
      <SSO />
      <ModalWrapper
        open={open}
        onClose={() => setOpen(false)}
        className="border-none"
        size="xl"
      >
        <Button
          className="ml-auto text-default-light"
          styleType={'none'}
          onClick={() => setOpen(false)}
        >
          <XMarkIcon className="size-6" />
        </Button>
        <div className="p-8 pt-0 text-center">
          <h3 className="text-2xl font-semibold">Confirm Your Email Address</h3>
          <p className="text-sm font-semibold">
            Please copy & paste the six-digit code emailed to your business
            address.
          </p>

          <OTPInput onSubmit={confirmOtpFn} />
          <Button
            disabled={isLoading}
            className="mt-6 w-full"
            styleType="primary"
          >
            Submit
          </Button>

          <Button
            disabled={isLoading}
            styleType="textPrimary"
            onClick={resendEmail}
          >
            Re-send Code
          </Button>
        </div>
      </ModalWrapper>
    </>
  );
};
