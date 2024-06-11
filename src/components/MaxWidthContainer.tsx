import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export function MaxWidthContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={twMerge('max-w-screen-xl w-full', className)}>
      {children}
    </div>
  );
}
