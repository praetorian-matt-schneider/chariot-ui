import React from 'react';

import { LogoIcon } from '../icons/Logo.icon';
import { MaxWidthContainer } from '../MaxWidthContainer';

const Footer = () => {
  return (
    <div className="w-full">
      <MaxWidthContainer className="m-auto">
        <footer className="mt-12 flex w-full items-center justify-between gap-2 border-t border-default p-4 text-xs text-gray-400">
          <div>
            Copyright &copy; {new Date().getFullYear()}. All Rights Reserved.
          </div>
          <div className="flex items-center">
            <LogoIcon className="mr-1 size-9" />
            <span className="text-lg font-bold leading-8">praetorian</span>
          </div>
          <div className="flex space-x-4 font-semibold">
            <a href="#" className="hover:underline">
              Terms of Service
            </a>
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="hover:underline">
              Manage Cookies
            </a>
          </div>
        </footer>
      </MaxWidthContainer>
    </div>
  );
};

export default Footer;
