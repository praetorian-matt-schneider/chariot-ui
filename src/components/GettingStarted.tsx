import { ComponentType } from 'react';
import {
  ExclamationTriangleIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  BellIcon,
  CheckCircleIcon,
  CloudIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/solid';

import { Button } from '@/components/Button';
import { Tooltip } from '@/components/Tooltip';
import { useModifyAccount } from '@/hooks';
import { AccountWithType } from '@/hooks/useIntegration';
import { Integrations } from '@/sections/overview/Integrations';
import { GetStartedStatus, Integration, IntegrationMeta } from '@/types';
import { cn } from '@/utils/classname';
import { pluralize } from '@/utils/pluralize.util';

export const GettingStartedStep: React.FC<{
  className?: string;
  title: string;
  description: string;
  status: GetStartedStatus;
  focusedStep: boolean;
  Icon: ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
  button: {
    text: string;
    Icon: ComponentType<React.SVGProps<SVGSVGElement>>;
  };
  connectedIntegrations?: IntegrationMeta[];
}> = ({
  className,
  title,
  description,
  status,
  focusedStep,
  Icon,
  onClick,
  button,
  connectedIntegrations,
}) => {
  return (
    <div
      className={cn(
        'flex flex-1 cursor-pointer items-start bg-header p-4 gap-2',
        className
      )}
      onClick={onClick}
    >
      <Tooltip
        title={status === 'setup' ? 'Requires Setup' : ''}
        placement="right"
      >
        <div
          className={cn(
            'flex size-14 justify-center text-lg font-bold text-header',
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
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <h3 className="flex-1 text-lg font-semibold text-header">{title}</h3>

          <div className="flex">
            {(connectedIntegrations || []).map(({ logo, name }, index) => (
              <div
                key={name}
                className={cn(
                  'justify-items flex size-6 items-center rounded border border-brand bg-white p-1',
                  index > 0 && '-ml-1'
                )}
              >
                <img className="mx-auto" src={logo} />
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-default-light">{description}</p>
        <Button
          className="flex w-fit rounded-full border border-brand px-3 py-1 text-xs text-white/60"
          styleType="textPrimary"
          startIcon={<button.Icon className="size-4" />}
        >
          {button.text}
        </Button>
      </div>
    </div>
  );
};

export const GettingStarted: React.FC<{
  title?: string;
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
  domain?: string;
  surfaces?: number;
  connectedNotifications: AccountWithType[];
}> = ({
  completedSteps,
  onRootDomainClick,
  onAttackSurfaceClick,
  onRiskNotificationsClick,
  total,
  isFreemiumMaxed,
  domain,
  surfaces,
  connectedNotifications,
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
            <div className="mb-6 flex w-full justify-between overflow-hidden rounded-lg border-2 border-header-dark">
              <GettingStartedStep
                className={'border-r-2 border-header-dark'}
                title={domain ?? 'Confirm Your Root Domain'}
                description="Start by defining your root domain. This helps us identify the core assets you need to monitor."
                status={completedSteps.rootDomain}
                focusedStep={focusedStepIndex === 0}
                Icon={GlobeAltIcon}
                onClick={onRootDomainClick}
                button={{
                  text: 'Edit Root Domain',
                  Icon: PencilIcon,
                }}
              />
              <GettingStartedStep
                className={'border-r-2 border-header-dark'}
                title={
                  surfaces && surfaces > 0
                    ? `${surfaces?.toLocaleString()} ${pluralize(surfaces, 'Surface')} Configured`
                    : 'Build Your Attack Surface'
                }
                description="Add integrations to map out and monitor all the assets within your organization."
                status={completedSteps.attackSurface}
                focusedStep={focusedStepIndex === 1}
                Icon={CloudIcon}
                onClick={onAttackSurfaceClick}
                button={{
                  text: 'Surface',
                  Icon: PlusIcon,
                }}
              />
              <GettingStartedStep
                title={
                  connectedNotifications.length > 0
                    ? `${connectedNotifications.length?.toLocaleString()} ${pluralize(connectedNotifications.length, 'Notification')} Configured`
                    : 'Add Push Notifications'
                }
                description="Configure notifications to stay informed about potential risks and vulnerabilities."
                status={completedSteps.riskNotifications}
                focusedStep={focusedStepIndex === 2}
                Icon={BellIcon}
                onClick={onRiskNotificationsClick}
                button={{
                  text: 'Notification Method',
                  Icon: PlusIcon,
                }}
                connectedIntegrations={connectedNotifications.map(
                  ({ member }) => Integrations[member as Integration]
                )}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
