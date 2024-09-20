import React, { createContext, useContext, useState } from 'react';

import { StorageKey, useStorage } from '@/utils/storage/useStorage.util';

interface UseModalState {
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
}

interface GlobalState {
  modal: {
    seed: UseModalState;
    risk: {
      open: boolean;
      type: 'risk' | 'material' | 'selectorScreen';
      onChange: (
        open: boolean,
        type: GlobalState['modal']['risk']['type']
      ) => void;
      selectedAssets: string[];
      onSelectedAssetsChange: React.Dispatch<React.SetStateAction<string[]>>;
      selectedRisks: string[];
      onSelectedRisksChange: React.Dispatch<React.SetStateAction<string[]>>;
    };
    asset: UseModalState;
    file: UseModalState;
    upgrade: UseModalState;
    pushNotification: UseModalState;
    surfaceSetup: UseModalState;
  };
  awsMarketplaceConfig: {
    value?: Record<string, string>;
    onChange: React.Dispatch<GlobalState['awsMarketplaceConfig']['value']>;
    verifyLinking: boolean;
    onVerifyLinkingChange: React.Dispatch<React.SetStateAction<boolean>>;
  };
  riskNotification: {
    value: { message: string } | null;
    onChange: (value: { message: string } | null) => void;
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
  const [riskType, setRiskType] =
    useState<GlobalState['modal']['risk']['type']>('selectorScreen');

  const [assetOpen, setAssetOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [pushNotificationOpen, setPushNotificationOpen] = useState(false);
  const [surfaceSetupOpen, setSurfaceSetupOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [riskNotification, setRiskNotification] = useState<{
    message: string;
  } | null>(null);

  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
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

  const handleRiskNotification = (
    value: GlobalState['riskNotification']['value']
  ) => {
    setRiskNotification(value);

    // Automatically close the notification after 3 seconds (optional)
    setTimeout(() => {
      setRiskNotification(null);
    }, 3000);
  };

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
            type: riskType,
            onChange: (open, type) => {
              setRiskOpen(open);
              setRiskType(type);
            },
            selectedAssets,
            onSelectedAssetsChange: setSelectedAssets,
            selectedRisks,
            onSelectedRisksChange: setSelectedRisks,
          },
          asset: { open: assetOpen, onOpenChange: setAssetOpen },
          file: { open: fileOpen, onOpenChange: setFileOpen },
          pushNotification: {
            open: pushNotificationOpen,
            onOpenChange: setPushNotificationOpen,
          },
          surfaceSetup: {
            open: surfaceSetupOpen,
            onOpenChange: setSurfaceSetupOpen,
          },
        },
        awsMarketplaceConfig: {
          value: awsMarketplaceConfig,
          onChange: setAwsMarketplaceConfig,
          verifyLinking,
          onVerifyLinkingChange: setVerifyLinking,
        },
        riskNotification: {
          value: riskNotification,
          onChange: handleRiskNotification,
        },
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};
