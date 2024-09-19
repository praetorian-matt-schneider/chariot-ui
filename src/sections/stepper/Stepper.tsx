import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowPathIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import {
  BellIcon,
  CheckCircleIcon,
  CloudIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';

import { useMy } from '@/hooks';
import { useGetRootDomain } from '@/hooks/useAttribute';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useIntegration } from '@/hooks/useIntegration';
import { RootDomainSetup } from '@/sections/stepper/RootDomainSetup';
import { SurfaceSetup } from '@/sections/stepper/SurfaceSetup';
import { useGlobalState } from '@/state/global.state';
import { mergeStatus } from '@/utils/api';
import { cn } from '@/utils/classname';
import { getRoute } from '@/utils/route.util';
import { generatePathWithSearch } from '@/utils/url.util';

export const Stepper = () => {
  const { modal } = useGlobalState();
  const { onOpenChange: onOpenChangeSurfaceSetup } = modal.surfaceSetup;
  const [openRootDomain, setOpenRootDomain] = useState(false);

  const { data: rootDomain } = useGetRootDomain();
  const {
    data: { attackSurfaceStatus, riskNotificationStatus },
    status: integrationStatus,
  } = useIntegration();
  // Check exposure alerts
  const { data: alerts, status: alertsStatus } = useMy({
    resource: 'condition',
  });
  // Check for Remediated risks
  const { data: risksGeneric, status: risksStatus } = useGenericSearch({
    query: 'status:R',
  });
  const status = mergeStatus(integrationStatus, alertsStatus, risksStatus);

  const navigate = useNavigate();

  const steps = [
    {
      label: 'Getting Started',
      completed: true,
    },
    {
      label: 'Confirm Domain',
      Icon: GlobeAltIcon,
      onClick: () => setOpenRootDomain(true),
      status: rootDomain?.value !== undefined ? 'connected' : 'notConnected',
    },
    {
      label: 'Add Surfaces',
      Icon: CloudIcon,
      onClick: () => onOpenChangeSurfaceSetup(true),
      status: attackSurfaceStatus,
    },
    {
      label: 'Customize Exposures',
      Icon: ExclamationTriangleIcon,
      status: alerts.length > 0 ? 'connected' : 'notConnected',
      onClick: () =>
        navigate(
          generatePathWithSearch({
            pathname: getRoute(['app', 'assets']),
            appendSearch: [['action', 'set-exposure-alerts']],
          })
        ),
    },
    {
      label: 'Get Notifications',
      Icon: BellIcon,
      onClick: () => navigate(getRoute(['app', 'account'])),
      status: riskNotificationStatus,
    },
    {
      label: 'Remediate a Risk',
      Icon: ArrowPathIcon,
      status:
        (risksGeneric?.risks || [])?.length > 0 ? 'connected' : 'notConnected',
      onClick: () =>
        navigate(
          generatePathWithSearch({
            pathname: getRoute(['app', 'risks']),
            appendSearch: [['action', 'remediate-a-risk']],
          })
        ),
    },
  ];

  const currentStep = steps.findIndex(
    ({ status }) => status === 'notConnected'
  );

  const isVisible = currentStep > -1 && status !== 'pending';

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="sticky bottom-0">
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ duration: 0.5, type: 'tween' }}
          >
            <div className="m-auto my-4 max-w-screen-xl px-4">
              <ul className="flex w-full list-none rounded border-2 border-brand/40 bg-brand/20 p-0 text-sm">
                {steps.map(({ label, Icon, status, onClick }, index) => (
                  <li
                    key={index}
                    className={cn(
                      'flex-1 flex gap-2 p-4 pl-8 items-center bg-brand ml-[-16px] text-white',
                      onClick && 'cursor-pointer',
                      (index < currentStep || index > currentStep) &&
                        'bg-gray-700/90',
                      index === currentStep && 'underline font-bold',
                      index === 0 && 'bg-brand/20 text-default ml-0 font-bold'
                    )}
                    style={{
                      clipPath:
                        index == 0
                          ? 'polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%)'
                          : index === steps.length - 1
                            ? 'polygon(20px 50%, 0% 0%, 100% 0%, 100% 100%, 0% 100%)'
                            : 'polygon(20px 50%, 0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%)',
                    }}
                    onClick={onClick}
                  >
                    {Icon && index > 0 && index >= currentStep && (
                      <Icon className="size-4" />
                    )}
                    {index > 0 && index < currentStep && (
                      <CheckCircleIcon
                        className={cn(
                          'size-5 text-[#10B981]',
                          status === 'setup' && 'text-yellow-400'
                        )}
                      />
                    )}
                    {}
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <RootDomainSetup
              open={openRootDomain}
              setOpen={setOpenRootDomain}
            />
            <SurfaceSetup />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
