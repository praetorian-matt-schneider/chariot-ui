import { ExclamationTriangleIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
  BellIcon,
  CheckCircleIcon,
  CloudIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/solid';

import { Button } from '@/components/Button';
import { useModifyAccount } from '@/hooks';

export const GettingStartedStep: React.FC<{
  title: string;
  description: string;
  isCompleted: boolean;
  icon: JSX.Element;
  onClick: () => void;
}> = ({ title, description, isCompleted, icon, onClick }) => {
  return (
    <div
      className="flex flex-1 cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-header-dark bg-header p-4 pt-0"
      onClick={onClick}
    >
      <div
        className={
          'flex size-14 items-center justify-center text-lg font-bold text-header'
        }
      >
        {isCompleted ? (
          <CheckCircleIcon className="size-8 text-green-500" />
        ) : (
          icon
        )}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-header">{title}</h3>
      <p className="text-center text-xs text-default-light">{description}</p>
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
  total: number;
  isFreemiumMaxed: boolean;
}> = ({
  completedSteps,
  onRootDomainClick,
  onAttackSurfaceClick,
  onRiskNotificationsClick,
  total,
  isFreemiumMaxed,
}) => {
  const allStepsCompleted =
    completedSteps.rootDomain &&
    completedSteps.attackSurface &&
    completedSteps.riskNotifications;

  const { mutate: upgrade, status: upgradeStatus } = useModifyAccount('link');

  return (
    <div className="flex justify-center space-x-6">
      <div className="w-full rounded-sm">
        {isFreemiumMaxed && (
          <div className="m-auto flex w-full flex-col items-center rounded-lg border-2 border-dashed border-header-dark bg-header p-8 text-center">
            <ExclamationTriangleIcon className="mb-2 size-12 text-yellow-500" />
            <h2 className="text-xl font-bold text-header-light">
              Uh oh, You are out of Space
            </h2>
            <p className="text-sm text-default-light">
              {`Your current plan only allows up to ${total} assets. But don't worry, we got a plan for you.`}
            </p>
            <Button
              styleType="primary"
              onClick={() => upgrade({ username: 'license', config: {} })}
              disabled={upgradeStatus === 'pending'}
              className="mt-6 h-10 rounded-md py-0"
            >
              Upgrade Plan
            </Button>
          </div>
        )}
        {allStepsCompleted && !isFreemiumMaxed && (
          <div className="m-auto flex w-full flex-col items-center rounded-lg border-4 border-dashed border-header-dark bg-header p-8">
            <h2 className="text-xl font-bold text-header-light">
              Build Your Attack Surface
            </h2>
            <p className="text-sm text-default-light">
              Continue adding more to build your attack surface
            </p>
            <Button
              styleType="primary"
              startIcon={<PlusIcon className="size-4" />}
              onClick={onAttackSurfaceClick}
              className="mt-6 h-10 rounded-md py-0"
            >
              Add Surface
            </Button>
          </div>
        )}
        {!allStepsCompleted && !isFreemiumMaxed && (
          <>
            <div className="mb-6 flex w-full justify-between gap-6">
              <GettingStartedStep
                title="Set Your Root Domain"
                description="Start by defining your root domain. This helps us identify the core assets you need to monitor."
                isCompleted={completedSteps.rootDomain}
                icon={<GlobeAltIcon className="size-8 text-default-light" />}
                onClick={onRootDomainClick}
              />
              <GettingStartedStep
                title="Build Your Attack Surface"
                description="Add integrations to map out and monitor all the assets within your organization."
                isCompleted={completedSteps.attackSurface}
                icon={<CloudIcon className="size-8 text-default-light" />}
                onClick={onAttackSurfaceClick}
              />
              <GettingStartedStep
                title="Set Risk Notifications"
                description="Configure notifications to stay informed about potential risks and vulnerabilities."
                isCompleted={completedSteps.riskNotifications}
                icon={<BellIcon className="size-8 text-default-light" />}
                onClick={onRiskNotificationsClick}
              />
            </div>
          </>
        )}
      </div>

      {allStepsCompleted && !isFreemiumMaxed && (
        <div className="m-auto flex w-full flex-col items-center rounded-lg border-4 border-dashed border-header-dark bg-header p-8">
          <h2 className="text-xl font-bold text-header-light">
            Set Risk Notifications
          </h2>
          <p className="text-sm text-default-light">
            Continue adding more to manage your notifications
          </p>
          <Button
            styleType="primary"
            startIcon={<PlusIcon className="size-4" />}
            onClick={onRiskNotificationsClick}
            className="mt-6 h-10 rounded-md py-0"
          >
            Add Workflow
          </Button>
        </div>
      )}
    </div>
  );
};
