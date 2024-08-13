import React, { useEffect, useState } from 'react';

import { useAuth } from '@/state/auth';
import { AssetStatus, AssetStatusLabel } from '@/types';

interface DomainDrawerContentProps {
  domain: string;
  onChange: (domain: string, scanOption: AssetStatus) => void;
}

export const DomainDrawerContent: React.FC<DomainDrawerContentProps> = ({
  domain,
  onChange,
}) => {
  const { friend, me } = useAuth();

  const emailDomain = (friend || me).split('@')[1];
  const domainToDiplay = domain ?? emailDomain;

  const [newDomain, setNewDomain] = useState<string>(domainToDiplay);
  const [scanOption, setScanOption] = useState<AssetStatus>(AssetStatus.Active); // Default to risk scanning

  useEffect(() => {
    onChange(newDomain, scanOption);
  }, [newDomain, scanOption]);

  return (
    <div className="mx-12">
      <h1 className="mb-4 text-4xl font-extrabold">Setup your root domain</h1>

      <div className="mt-4">
        <p>
          We’ve detected your email domain as{' '}
          <span className="font-bold">{emailDomain}</span>.
        </p>
        <p className="mt-1 text-sm">
          This domain will be set automatically. If you prefer, you can enter a
          different domain below.
        </p>
      </div>

      <div className="mt-6">
        <label htmlFor="domain" className="block text-sm font-medium">
          Enter a Different Domain (optional)
        </label>
        <input
          type="text"
          id="domain"
          className="mt-2 block w-full rounded-sm border border-gray-300 bg-white p-3 text-black placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="example.com"
          value={newDomain}
          onChange={e => setNewDomain(e.target.value)}
        />
      </div>

      <div className="mt-8">
        <h4 className="text-md font-medium">Choose your scanning option:</h4>
        <div className="mt-3 space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              className="form-radio"
              name="scanOption"
              value="discovery"
              checked={scanOption === AssetStatus.ActiveLow}
              onChange={() => setScanOption(AssetStatus.ActiveLow)}
            />
            <span>
              {AssetStatusLabel[AssetStatus.ActiveLow]} (enumerate assets)
            </span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              className="form-radio"
              name="scanOption"
              value="risk"
              checked={scanOption === AssetStatus.Active}
              onChange={() => setScanOption(AssetStatus.Active)}
            />
            <span>{AssetStatusLabel[AssetStatus.Active]} (preferred)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
