import React, { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

import { Button } from '@/components/Button';
import { AssetStatus } from '@/types';
import { cn } from '@/utils/classname';

const options = [
  {
    label: 'Discover assets',
    value: AssetStatus.ActiveLow,
  },
  {
    label: 'Discover assets and scan for risks',
    value: AssetStatus.Active,
  },
];

const ChariotLandingPage: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [assetStatus, setAssetStatus] = useState<AssetStatus>(options[0].value);

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDomain(e.target.value);
  };

  const handleRegister = () => {
    // Handle register action
  };

  const handleScanNow = () => {
    // Handle scan now action
  };

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center p-4 text-white"
      style={{
        background: 'rgb(13, 13, 40)',
      }}
    >
      <div className="absolute inset-0 z-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          id="Layer_1"
          data-name="Layer 1"
          viewBox="0 0 2834 1005"
          className="size-full"
        >
          <defs>
            <style>
              {'.cls-1 { fill: url(#radial-gradient); stroke-width: 0px; }'}
            </style>
            <radialGradient
              id="radial-gradient"
              cx="1106"
              cy="363.4"
              fx="1106"
              fy="363.4"
              r="1"
              gradientTransform="translate(516341 -966231.5) rotate(90) scale(874.5 1417)"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#5f47b7" stopOpacity=".4" />
              <stop offset="1" stopColor="#2a1f51" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            className="cls-1"
            d="M2715.6,731.3c215,369.6,153.2,772.1-262.2,937.3-415.3,165.1-1181.2,94.3-1720.3-119.5C194.1,1333.6-118.1,975.1,46.9,641.7,214.8,308.3,862.8-1.5,1434.3,11.1c571.5,14.2,1066.3,349.1,1281.4,720.2h-.1Z"
          />
        </svg>
      </div>
      <main className="relative z-10 flex w-full flex-1 flex-col items-center justify-center text-center">
        <div className="m-4 flex w-3/4 flex-row items-center justify-center space-x-4">
          <div className="mb-0 w-[600px]">
            <svg
              width="100%"
              height={'100%'}
              viewBox={`0 0 74 74`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M37.0306 0C56.3771 0 72.0612 15.6872 72.0612 35.0306C72.0612 47.071 65.9842 57.693 56.7333 64C48.3901 58.9979 41.831 51.1874 40.6585 42.5101C36.8982 41.782 32.3594 41.5551 29.0373 42.5511L25.857 32.4113L30.7173 40.2565C33.4626 39.7427 36.5452 39.7364 39.7728 40.2407C38.2977 39.1722 37.371 39.0052 35.1709 38.2991C43.8041 38.2203 52.2418 46.3397 53.7642 53.7152L60.6575 53.2015L65.3948 44.9308C57.9342 37.1739 52.5349 29.1018 51.9581 21.1306L37.475 10.8174C36.7406 12.2799 36.52 13.8307 36.5704 15.4224C34.6131 12.8725 36.4727 9.39591 38.9091 4.79409C39.2937 4.03763 39.549 3.56799 37.8438 4.12273C33.1064 5.66718 29.5006 8.46609 27.392 11.5329C12.4297 18.1079 5.22128 28.1594 2.94558 37.7633L2.52322 41.0917C2.17966 39.1249 2 37.1014 2 35.0369C2 15.6872 17.684 0 37.0306 0ZM38.7925 10.975L42.2565 13.5218C42.7419 12.3997 44.0468 10.7828 45.9884 9.54405C46.6881 9.16267 46.9434 8.69934 45.2886 8.85378C42.9247 9.07126 40.2014 10.4045 38.7925 10.975ZM61.5369 48.1962L59.9483 43.3359L57.9752 43.9001L58.2179 46.3145C59.4188 44.8898 59.9231 46.6927 61.5369 48.1962ZM38.118 21.8208C41.0808 23.381 40.8665 23.8255 41.0966 26.7505L44.135 28.7173L45.919 29.1396L47.7787 31.1348C45.2697 27.1066 43.5015 23.1573 38.118 21.8208Z"
                fill={'#ffffff'}
              />
            </svg>
          </div>
          <div className="text-right">
            <h1 className="mb-8 text-6xl font-extrabold">
              Manage Your Attack Surface with Chariot
            </h1>
            <p className="mb-8 text-xl">
              Proactively identify and address vulnerabilities in your
              organization.
            </p>
          </div>
        </div>

        <div className="w-3/4">
          <input
            type="text"
            value={domain}
            onChange={handleDomainChange}
            className="block h-16 w-full rounded-sm bg-layer0 px-3 py-2 pr-[400px] text-xl font-bold text-black shadow-sm focus:outline-none"
            placeholder="Enter your domain name"
          />
          <div className="relative mt-6 w-full space-x-4">
            <div className="flex justify-center space-x-4">
              {options.map(option => (
                <div
                  key={option.value}
                  className={cn(
                    'group w-full',
                    assetStatus === option.value && 'is-selected'
                  )}
                  onClick={() => setAssetStatus(option.value)}
                >
                  <div className="relative flex w-full cursor-pointer items-center justify-between rounded-sm bg-header-dark px-5 py-4 text-layer0 shadow-md transition focus:outline-none group-[.is-selected]:bg-header-light data-[focus]:outline-1 data-[focus]:outline-layer0">
                    <p className="text-sm/6 font-semibold text-layer0">
                      {option.label}
                    </p>
                    <CheckCircleIcon className="size-6 fill-layer0 opacity-0 transition group-[.is-selected]:opacity-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between space-x-4">
            <Button
              styleType="none"
              onClick={handleRegister}
              className="mt-6 h-16 w-1/2 border border-brand text-2xl font-semibold"
            >
              Sign in to continue
            </Button>
            <Button
              styleType="primary"
              onClick={handleScanNow}
              className="mt-6 h-16 w-1/2 rounded-sm text-2xl font-semibold"
            >
              Register to scan now
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChariotLandingPage;
