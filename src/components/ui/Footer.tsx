import { LogoIcon } from '@/components/icons/Logo.icon';

const Footer = () => {
  return (
    <div className="w-full">
      <div className="m-auto w-full max-w-screen-xl">
        <footer className="flex w-full items-center justify-between gap-4 overflow-x-auto text-nowrap p-4 text-xs text-gray-400">
          <div>
            Copyright &copy; {new Date().getFullYear()}. All Rights Reserved.
          </div>
          <div className="center flex items-center justify-center max-md:hidden">
            <LogoIcon className="mr-2 mt-1 size-5" />
            <span className="text-lg font-bold leading-8">praetorian</span>
          </div>
          <div className="flex items-center gap-2 font-semibold">
            <a
              href="https://www.praetorian.com/terms-of-service/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Terms of Service
            </a>
            <div className="h-4 border-r border-gray-300" />
            <a
              href="https://github.com/praetorian-inc/chariot-ui"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Source Code
            </a>
            <div className="h-4 border-r border-gray-300" />
            <a
              href="https://github.com/praetorian-inc/praetorian-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Command Line
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Footer;
