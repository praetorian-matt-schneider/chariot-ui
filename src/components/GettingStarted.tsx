import { ComponentType } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
  BellIcon,
  CheckCircleIcon,
  CloudIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/solid';

import { Button } from '@/components/Button';
import { Tooltip } from '@/components/Tooltip';
import { useModifyAccount } from '@/hooks';
import { GetStartedStatus } from '@/types';
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
  const focusedStepIndex = [
    completedSteps.rootDomain,
    completedSteps.attackSurface,
    completedSteps.riskNotifications,
  ].findIndex(status => status === 'notConnected');

  const { mutate: upgrade, status: upgradeStatus } = useModifyAccount('link');

  return (
    <div className="z-10 flex justify-center space-x-6">
      <div className="w-full rounded-sm">
        {isFreemiumMaxed && (
          <div className="m-auto flex w-full flex-col items-center rounded-lg border-2 border-dashed border-header-dark bg-header p-8 text-center">
            <ExclamationTriangleIcon className="mb-2 size-12 text-yellow-500" />
            <h2 className="text-xl font-bold text-header-light">
              Uh oh, you are out of space
            </h2>
            <p className="text-sm text-default-light">
              {`Your current plan allows up to ${total} assets. You can keep adding more for now, and when you're ready, we've got a plan for you.`}
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
        {!isFreemiumMaxed && (
          <>
            <div className="mb-6 flex w-full justify-between gap-6">
              <GettingStartedStep
                title="Confirm Your Root Domain"
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
                title="Add Push Notifications"
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
    </div>
  );
};
