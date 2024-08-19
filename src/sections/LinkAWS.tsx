import { useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { Modal } from '@/components/Modal';
import { useModifyAccount } from '@/hooks';
import { useGlobalState } from '@/state/global.state';
import { AccountMetadata } from '@/types';

export const LinkAWS = () => {
  const { awsMarketplaceConfig } = useGlobalState();

  const { mutate: link, status } = useModifyAccount('link');

  function onClose() {
    awsMarketplaceConfig.onChange(undefined);
    awsMarketplaceConfig.onVerifyLinkingChange(false);
  }

  function linkAws() {
    link({
      username: 'awsmarketplace',
      value: '',
      config: awsMarketplaceConfig.value as AccountMetadata,
    });
    onClose();
  }

  useEffect(() => {
    if (awsMarketplaceConfig.value && !awsMarketplaceConfig.verifyLinking) {
      linkAws();
    }
  }, []);

  return (
    <Modal
      icon={<ExclamationTriangleIcon className="size-7 text-yellow-600" />}
      title={'Link to AWS'}
      onClose={onClose}
      className="px-8"
      open={awsMarketplaceConfig.verifyLinking}
      footer={{
        text: 'Confirm',
        disabled: status === 'pending',
        onClick: async () => {
          linkAws();
        },
      }}
    >
      Are you sure you want to connect to AWS Marketplace ?
    </Modal>
  );
};
