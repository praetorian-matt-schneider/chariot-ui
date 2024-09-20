import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { GlobeAltIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/Button';
import { InputText } from '@/components/form/InputText';
import { AssetIcon } from '@/components/icons/Asset.icon';
import { WWWIcon } from '@/components/icons/WWW.icon';
import { ModalWrapper } from '@/components/Modal';
import { useCreateAsset } from '@/hooks/useAssets';
import {
  useBulkDeleteAttributes,
  useCreateAttribute,
  useGetRootDomain,
} from '@/hooks/useAttribute';
import { useAuth } from '@/state/auth';
import { AssetStatus } from '@/types';

interface RootDomainSetupProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export const RootDomainSetup: React.FC<RootDomainSetupProps> = ({
  open,
  setOpen,
}) => {
  const { mutateAsync: createAsset } = useCreateAsset();
  const { data: rootDomain, refetch } = useGetRootDomain();
  const { friend, me } = useAuth();
  const { mutateAsync: deleteAttribute } = useBulkDeleteAttributes({
    showToast: false,
  });
  const { mutateAsync: createAttribute } = useCreateAttribute('', true);

  const emailDomain = (friend || me).split('@')[1];
  // TODO : Check if domain exist
  const [newDomain, setNewDomain] = useState<string>(
    rootDomain?.value || emailDomain
  );
  const [updatedRootDomain, setUpdatedRootDomain] = useState<{
    domain: string;
    scanOption: AssetStatus;
  }>();

  useEffect(() => {
    setUpdatedRootDomain({ domain: newDomain, scanOption: AssetStatus.Active });
  }, [newDomain, setUpdatedRootDomain]);

  function handleClose() {
    setOpen(false);
  }

  async function handleUpdateRootDomain() {
    if (!updatedRootDomain) return;

    await createAsset({
      name: updatedRootDomain?.domain,
      status: updatedRootDomain?.scanOption,
    });

    if (rootDomain?.key) {
      await deleteAttribute([rootDomain]);
    }
    await createAttribute({
      key: `#asset#${updatedRootDomain?.domain}#${updatedRootDomain?.domain}`,
      name: 'CHARIOT__ROOT_DOMAIN',
      value: updatedRootDomain?.domain,
    });

    refetch();
    setOpen(false);
  }

  return (
    <ModalWrapper
      size="3xl"
      className="rounded-lg px-6 py-4"
      open={open}
      onClose={() => setOpen(false)}
    >
      <header className="">
        <div className="flex items-center gap-2">
          <GlobeAltIcon className="size-6" />
          <h4 className="flex-1 text-2xl font-bold">
            {'Confirm Your Root Domain'}
          </h4>
          <Button
            aria-label="CloseIcon"
            className="p-0"
            onClick={handleClose}
            styleType="none"
          >
            <XMarkIcon className="size-6" />
          </Button>
        </div>
        <p className="text-sm text-default-light">
          The domain you are currently signed in with. To change it, invite a
          user from a new domain.
        </p>
      </header>
      <div className="my-6">
        <InputText
          name="search"
          value={newDomain}
          onChange={e => setNewDomain(e.target.value)}
          placeholder="Root Domain"
          className="mb-4"
        />
        {/* Horizontal Info Section */}
        <section className="grid grid-cols-2 gap-6">
          <div className="relative rounded-md border-2 border-default p-6 shadow-sm">
            <div className="absolute -right-2 -top-2 w-fit rounded bg-brand p-2">
              <WWWIcon />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              What is a Root Domain?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {`Your root asset is a critical component of your organization, representing your business's primary online identity.`}
            </p>
          </div>

          <div className="relative rounded-md border-2 border-default p-6 shadow-sm">
            <div className="absolute -right-2 -top-2 w-fit rounded bg-brand p-2">
              <AssetIcon />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              What is an Asset?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              An asset is anything in your organization that can hold or
              transmit data, such as websites, IP addresses or GitHub
              organizations.
            </p>
          </div>
        </section>
      </div>
      <div className="flex w-full justify-end">
        <Button
          styleType="primary"
          className="rounded"
          onClick={handleUpdateRootDomain}
        >
          Update Root Domain
        </Button>
      </div>
    </ModalWrapper>
  );
};
