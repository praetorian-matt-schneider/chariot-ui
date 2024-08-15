import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { Modal } from '@/components/Modal';
import { useModifyAccount } from '@/hooks';
import { AccountMetadata } from '@/types';
import { appStorage } from '@/utils/storage/appStorage.util';
import { StorageKey } from '@/utils/storage/useStorage.util';

export const LinkAWS = () => {
  const { mutate: link, status } = useModifyAccount('link');
  const awsMarketplaceConfig = appStorage.getItem<AccountMetadata>(
    StorageKey.AWS_MARKETPLACE_CONFIG
  );
  const confirmLinkAWS = appStorage.getItem<boolean>(
    StorageKey.CONFIRM_LINK_AWS
  );

  function onClose() {
    appStorage.removeItem(StorageKey.CONFIRM_LINK_AWS);
    appStorage.removeItem(StorageKey.AWS_MARKETPLACE_CONFIG);
  }

  return (
    <Modal
      icon={<ExclamationTriangleIcon className="size-7 text-yellow-600" />}
      title={'Link to AWS'}
      onClose={onClose}
      className="px-8"
      open={Boolean(confirmLinkAWS)}
      footer={{
        text: 'Confirm',
        disabled: status === 'pending',
        onClick: async () => {
          if (awsMarketplaceConfig) {
            await link({
              username: 'awsmarketplace',
              value: '',
              config: awsMarketplaceConfig,
            });
            onClose();
          }
        },
      }}
    >
      Are you sure you want to connect to AWS Marketplace ?
    </Modal>
  );
};
