import { LogoIcon } from '@/components/icons/Logo.icon';
import { Quotes } from '@/components/icons/Quotes.icon';

const Data = {
  avatar: '/icons/SignupAvatar.png',
  quote:
    'Praetorian has been phenomenal - not only as a tactical partner in helping to address what I need to focus on today, but as a strategic partner engaging in our security roadmap so they can identify how they can plug-in and support me tomorrow.',
  name: 'Rinki Sethi',
  designation: 'CISO @ Bill.com',
};

export const CustomerQuote = () => {
  return (
    <div className="relative flex basis-0 flex-col justify-center overflow-hidden bg-header max-md:hidden md:basis-1/2 xl:basis-3/5">
      <LogoIcon className="absolute -left-24 mr-4 size-[120%] opacity-30" />
      <div className="relative flex w-full flex-col items-center justify-center xl:flex-row">
        <div className="relative m-8 w-1/2 xl:order-last">
          <Quotes className="absolute -left-10 -top-10" />
          <Quotes className="absolute -bottom-10 -right-10 rotate-180" />
          <h1 className="text-md relative font-bold text-layer0 xl:text-3xl">
            {Data.quote}
          </h1>
        </div>
        <hr className="w-1/2 rounded border-t-4 border-default xl:hidden" />
        <div className="h-1/2 rounded border-l-4 border-default max-xl:hidden xl:order-2" />
        <div className="relative m-8 w-1/2 xl:order-first">
          <img src={Data.avatar} alt="Signup avatar" className="max-w-50" />
          <div className="absolute bottom-12 right-0">
            <h3 className="mb-1 font-bold text-layer0">{Data.name}</h3>
            <p className="text-xs text-default-light">{Data.designation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
