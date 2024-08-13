import { useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { Bell, Cloud, Globe } from 'lucide-react';

import { cn } from '@/utils/classname';
import { useStorage } from '@/utils/storage/useStorage.util';

export const GettingStartedStep: React.FC<{
  title: string;
  description: string;
  isCompleted: boolean;
  icon: JSX.Element;
  onClick: () => void;
}> = ({ title, description, isCompleted, icon, onClick }) => {
  return (
    <div
      className="mx-2 flex flex-1 cursor-pointer flex-col items-center rounded-lg bg-header-dark p-4 shadow-md"
      onClick={onClick}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full text-white mb-4',
          'h-14 w-14 text-lg font-bold',
          isCompleted
            ? 'bg-green-500'
            : title?.toLowerCase().includes('root domain')
              ? 'bg-blue-500'
              : 'bg-gray-700'
        )}
      >
        {isCompleted ? <CheckIcon className="size-8" /> : icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-center text-sm text-gray-300">{description}</p>
    </div>
  );
};

export const GettingStarted: React.FC<{
  completedSteps: {
    rootDomain: boolean;
    attackSurface: boolean;
    riskNotifications: boolean;
  };
  onRootDomainClick: () => void;
  onAttackSurfaceClick: () => void;
  onRiskNotificationsClick: () => void;
}> = ({
  completedSteps,
  onRootDomainClick,
  onAttackSurfaceClick,
  onRiskNotificationsClick,
}) => {
  const [isDismissed, setIsDismissed] = useStorage<boolean>(
    { key: 'gettingStartedDismissed' },
    false
  );

  const allStepsCompleted =
    completedSteps.rootDomain &&
    completedSteps.attackSurface &&
    completedSteps.riskNotifications;

  // Reopen the Getting Started section if any step becomes unconfigured
  useEffect(() => {
    if (!allStepsCompleted && isDismissed) {
      setIsDismissed(false);
    }
  }, [completedSteps, allStepsCompleted, isDismissed, setIsDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="mt-6 rounded-sm border border-gray-600 bg-header shadow-md">
      <div className="w-full rounded-sm bg-header p-6 shadow-lg">
        {allStepsCompleted ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              Attack Surface Configured
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              All caught up! Your attack surface is properly configured.
            </p>
            <button
              onClick={handleDismiss}
              className="rounded-sm bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
            >
              Dismiss
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white">Getting Started</h2>
            <p className="mb-6 text-sm text-gray-500">
              Follow these steps to complete the setup of your account.
            </p>
            <div className="mb-6 flex w-full justify-between">
              <GettingStartedStep
                title="Set Your Root Domain"
                description="Start by defining your root domain. This helps us identify the core assets you need to monitor."
                isCompleted={completedSteps.rootDomain}
                icon={<Globe size={28} />}
                onClick={onRootDomainClick}
              />
              <GettingStartedStep
                title="Build Your Attack Surface"
                description="Add integrations to map out and monitor all the assets within your organization."
                isCompleted={completedSteps.attackSurface}
                icon={<Cloud size={28} />}
                onClick={onAttackSurfaceClick}
              />
              <GettingStartedStep
                title="Set Risk Notifications"
                description="Configure notifications to stay informed about potential risks and vulnerabilities."
                isCompleted={completedSteps.riskNotifications}
                icon={<Bell size={28} />}
                onClick={onRiskNotificationsClick}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
