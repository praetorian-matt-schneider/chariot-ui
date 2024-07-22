import { LogoIcon } from '@/components/icons/Logo.icon';
import { Quotes } from '@/components/icons/Quotes.icon';

const Data = {
  avatar: '/icons/SignupAvatar.png',
  quote:
    'Praetorian has been phenomenal- not only as a tactical partner in helping to address what I need to focus on today, but as a strategic partner engaging in our security roadmap so they can identify how they can plug-in and support me tomorrow.',
  name: 'Rinki Sethi',
  designation: 'CISO @ Bill.com',
};

export const CustomerQuote = () => {
  return (
    <div className="relative flex basis-3/5 flex-col justify-center overflow-hidden bg-header">
      <LogoIcon className="absolute -left-24 mr-4 size-[120%] opacity-30" />
      <div className="relative flex w-full items-center justify-center">
        <div className="relative m-16 w-1/2">
          <img src={Data.avatar} alt="Signup avatar" />
          <div className="absolute bottom-12 right-0">
            <h3 className="mb-1 font-bold text-layer0">{Data.name}</h3>
            <p className="text-xs text-default-light">{Data.designation}</p>
          </div>
        </div>
        <div className="h-1/2 rounded border-0 border-l-4 border-default" />
        <div className="relative m-16 w-1/2">
          <Quotes className="absolute -left-10 -top-10" />
          <Quotes className="absolute -bottom-10 -right-10 rotate-180" />
          <h1 className="relative text-3xl font-bold text-layer0">
            {Data.quote}
          </h1>
        </div>
      </div>
    </div>
  );
};
