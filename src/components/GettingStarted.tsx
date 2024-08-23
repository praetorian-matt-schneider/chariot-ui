import { ComponentType } from 'react';
import { ExclamationTriangleIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
  BellIcon,
  CheckCircleIcon,
  CloudIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/solid';

import { Button } from '@/components/Button';
import { Tooltip } from '@/components/Tooltip';
import { useModifyAccount } from '@/hooks';
import { GetStartedStatus } from '@/hooks/useIntegration';
import { cn } from '@/utils/classname';

export const GettingStartedStep: React.FC<{
  title: string;
  description: string;
  status: GetStartedStatus;
  focusedStep: boolean;
  Icon: ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
}> = ({ title, description, status, focusedStep, Icon, onClick }) => {
  return (
    <div
      className="flex flex-1 cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-header-dark bg-header p-4 pt-0"
      onClick={onClick}
    >
      <Tooltip
        title={status === 'setup' ? 'Requires Setup' : ''}
        placement="right"
      >
        <div
          className={cn(
            'flex size-14 items-center justify-center text-lg font-bold text-header',
            focusedStep && 'animate-bounce'
          )}
        >
          {status === 'connected' && (
            <CheckCircleIcon className="size-8 text-green-500" />
          )}
          {status === 'setup' && (
            <CheckCircleIcon className="size-8 text-yellow-500" />
          )}
          {status === 'notConnected' && (
            <Icon
              className={cn(
                'size-8',
                focusedStep ? 'text-default-white' : 'text-default-light'
              )}
            />
          )}
        </div>
      </Tooltip>
      <h3 className="mb-2 text-lg font-semibold text-header">{title}</h3>
      <p className="text-center text-xs text-default-light">{description}</p>
    </div>
  );
};

export const GettingStarted: React.FC<{
  completedSteps: {
    rootDomain: GetStartedStatus;
    attackSurface: GetStartedStatus;
    riskNotifications: GetStartedStatus;
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
  const allStepsCompleted = [
    completedSteps.rootDomain,
    completedSteps.attackSurface,
    completedSteps.riskNotifications,
  ].every(status => status === 'connected');

  const focusedStepIndex = [
    completedSteps.rootDomain,
    completedSteps.attackSurface,
    completedSteps.riskNotifications,
  ].findIndex(status => status === 'notConnected');

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
                status={completedSteps.rootDomain}
                focusedStep={focusedStepIndex === 0}
                Icon={GlobeAltIcon}
                onClick={onRootDomainClick}
              />
              <GettingStartedStep
                title="Build Your Attack Surface"
                description="Add integrations to map out and monitor all the assets within your organization."
                status={completedSteps.attackSurface}
                focusedStep={focusedStepIndex === 1}
                Icon={CloudIcon}
                onClick={onAttackSurfaceClick}
              />
              <GettingStartedStep
                title="Set Risk Notifications"
                description="Configure notifications to stay informed about potential risks and vulnerabilities."
                status={completedSteps.riskNotifications}
                focusedStep={focusedStepIndex === 2}
                Icon={BellIcon}
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
