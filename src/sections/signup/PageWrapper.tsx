import { PropsWithChildren } from 'react';

import { CustomerQuote } from '@/sections/signup/CustomerQuote';

interface Props extends PropsWithChildren {
  title: string;
  description?: string;
}

export const PageWrapper = ({
  title = 'Sign in with your email and password',
  description = '',
  children,
}: Props) => {
  return (
    <div className="flex size-full bg-layer0">
      <div
        className={`basis-full space-y-8 overflow-auto bg-layer0 p-8 md:basis-1/2 md:p-16 xl:basis-2/5`}
      >
        <img
          className="w-24"
          src="/icons/praetorian.png"
          alt="Praetorian Logo"
        />
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-sm">{description}</p>
        {children}
      </div>
      <CustomerQuote />
    </div>
  );
};
