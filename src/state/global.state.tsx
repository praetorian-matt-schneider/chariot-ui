import React, { createContext, useContext, useState } from 'react';

import { StorageKey, useStorage } from '@/utils/storage/useStorage.util';

interface UseModalState {
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
}

interface SelectedAssets {
  selectedAssets: string[];
  onSelectedAssetsChange: React.Dispatch<React.SetStateAction<string[]>>;
}

interface GlobalState {
  modal: {
    seed: UseModalState;
    risk: UseModalState & SelectedAssets;
    asset: UseModalState;
    file: UseModalState;
    upgrade: UseModalState;
  };
  awsMarketplaceConfig: {
    value?: Record<string, string>;
    onChange: React.Dispatch<GlobalState['awsMarketplaceConfig']['value']>;
    verifyLinking: boolean;
    onVerifyLinkingChange: React.Dispatch<React.SetStateAction<boolean>>;
  };
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [seedOpen, setSeedOpen] = useState(false);
  const [riskOpen, setRiskOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);

  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [awsMarketplaceConfig, setAwsMarketplaceConfig] = useStorage<
    GlobalState['awsMarketplaceConfig']['value']
  >({
    key: StorageKey.AWS_MARKETPLACE_CONFIG,
  });
  const [verifyLinking, setVerifyLinking] = useStorage<
    GlobalState['awsMarketplaceConfig']['verifyLinking']
  >(
    {
      key: StorageKey.AWS_MARKETPLACE_CONFIG_VERIFY_LINKING,
    },
    false
  );

  return (
    <GlobalStateContext.Provider
      value={{
        modal: {
          upgrade: {
            open: upgradeOpen,
            onOpenChange: setUpgradeOpen,
          },
          seed: { open: seedOpen, onOpenChange: setSeedOpen },
          risk: {
            open: riskOpen,
            onOpenChange: setRiskOpen,
            selectedAssets,
            onSelectedAssetsChange: setSelectedAssets,
          },
          asset: { open: assetOpen, onOpenChange: setAssetOpen },
          file: { open: fileOpen, onOpenChange: setFileOpen },
        },
        awsMarketplaceConfig: {
          value: awsMarketplaceConfig,
          onChange: setAwsMarketplaceConfig,
          verifyLinking,
          onVerifyLinkingChange: setVerifyLinking,
        },
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};
