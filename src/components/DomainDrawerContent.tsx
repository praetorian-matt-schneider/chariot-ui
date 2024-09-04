import React, { useEffect, useState } from 'react';

import { useAuth } from '@/state/auth';
import { AssetStatus } from '@/types';

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
  const [newDomain, setNewDomain] = useState<string>(domain || emailDomain);

  useEffect(() => {
    onChange(newDomain, AssetStatus.Active);
  }, [newDomain, onChange]);

  return (
    <div className="w-full space-y-8 p-4 sm:p-8">
      {/* Root Domain Setup Section */}
      <section className="rounded-sm bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-800">
          Confirm Your Root Domain
        </h2>
        <p className="mt-2 text-base text-gray-700">
          This is the domain you are currently signed in with. To change it,
          invite a user from the new domain.
        </p>

        <div className="mt-6">
          <label
            htmlFor="domain"
            className="block text-sm font-medium text-gray-700"
          >
            Root Domain
          </label>
          <input
            type="text"
            id="domain"
            className="mt-2 block w-full rounded-sm border border-default px-4 py-3 text-lg"
            placeholder="example.com"
            value={newDomain || emailDomain}
            onChange={e => setNewDomain(e.target.value)}
          />
        </div>
      </section>

      {/* Horizontal Info Section */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-sm bg-gray-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">
            What is a Root Domain?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your root domain is the primary domain of your organization. It’s
            usually the domain tied to your business, like{' '}
            <span className="font-bold">{emailDomain}</span>.
          </p>
        </div>

        <div className="rounded-sm bg-gray-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">
            What is an Asset?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            An asset is anything in your organization that can hold or transmit
            data, such as websites, IP addresses or GitHub organizations.
          </p>
        </div>

        <div className="rounded-sm bg-gray-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">
            What are Integrations?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Integrations allow you to add additional services, like cloud
            providers, to expand your attack surface. These surfaces are
            monitored continuously for new assets.
          </p>
        </div>
      </section>
    </div>
  );
};
