import { PropsWithChildren } from 'react';

import { CustomerQuote } from '@/sections/signup/CustomerQuote';

interface Props extends PropsWithChildren {
  title: string;
}

export const PageWrapper = ({
  title = 'Sign in with your email and password',
  children,
}: Props) => {
  return (
    <div className="flex size-full bg-layer0">
      <div className="basis-2/5 space-y-8 overflow-auto p-24">
        <img
          className="w-24"
          src="/icons/praetorian.png"
          alt="Praetorian Logo"
        />
        <h1 className="text-3xl font-bold">{title}</h1>
        {children}
      </div>
      <CustomerQuote />
    </div>
  );
};
