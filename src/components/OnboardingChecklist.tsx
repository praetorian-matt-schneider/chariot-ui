import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import confetti from 'canvas-confetti';

import { GetStartedStatus } from '@/types';
import { cn } from '@/utils/classname';
import { getRoute } from '@/utils/route.util';
import { useStorage } from '@/utils/storage/useStorage.util';
import { generatePathWithSearch } from '@/utils/url.util';

interface OnboardingChecklistProps {
  rootDomain: string;
  attackSurfacesConfigured: GetStartedStatus;
  notificationsConfigured: GetStartedStatus;
  exposureAlertsConfigured: boolean;
  risksRemediated: number;
}

const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  rootDomain,
  attackSurfacesConfigured,
  notificationsConfigured,
  exposureAlertsConfigured,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showChecklist, setShowChecklist] = useStorage(
    {
      key: 'show-onboarding-checklist',
    },
    true
  );
  const navigate = useNavigate();
  const location = useLocation();

  // Automatically close the FAB when the route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleConfetti = () => {
    // Trigger the confetti effect
    confetti({
      particleCount: 150,
      spread: 60,
    });
    // Optionally, hide the checklist
    setShowChecklist(false);
  };

  const ctaItems = [
    {
      label: 'Set Your Root Domain',
      action: () => {
        setIsOpen(false);
        navigate(
          generatePathWithSearch({
            pathname: getRoute(['app', 'overview']),
            appendSearch: [['action', 'set-root-domain']],
          })
        );
      },
      isCompleted: !!rootDomain,
    },
    {
      label: 'Build Your Attack Surface',
      isCompleted: attackSurfacesConfigured === 'connected',
      action: () => {
        setIsOpen(false);
        navigate(
          generatePathWithSearch({
            pathname: getRoute(['app', 'overview']),
            appendSearch: [['action', 'build-attack-surface']],
          })
        );
      },
    },
    {
      label: 'Set Risk Notifications',
      isCompleted: notificationsConfigured === 'connected',
      action: () => {
        setIsOpen(false);
        navigate(
          generatePathWithSearch({
            pathname: getRoute(['app', 'overview']),
            appendSearch: [['action', 'set-risk-notifications']],
          })
        );
      },
    },
    {
      label: 'Set Exposure Alerts',
      isCompleted: exposureAlertsConfigured,
      action: () => {
        setIsOpen(false);
        navigate(
          generatePathWithSearch({
            pathname: getRoute(['app', 'assets']),
            appendSearch: [['action', 'set-exposure-alerts']],
          })
        );
      },
    },
  ];

  // Calculate the number of incomplete tasks
  const incompleteTasks = ctaItems.filter(item => !item.isCompleted).length;

  if (!showChecklist) {
    return null; // Hide the checklist if dismissed
  }

  return (
    <div className="fixed bottom-6 right-6 z-10">
      {/* FAB Icon */}
      <button
        onClick={toggleMenu}
        className={cn(
          'relative rounded-full bg-blue-600 p-4 text-white shadow-lg transition-transform duration-300',
          isOpen ? 'scale-125' : 'scale-100'
        )}
        aria-label="FAB Menu"
      >
        <svg
          className="relative z-10"
          width={50}
          height={50}
          viewBox="0 0 74 74"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M37.0306 0C56.3771 0 72.0612 15.6872 72.0612 35.0306C72.0612 47.071 65.9842 57.693 56.7333 64C48.3901 58.9979 41.831 51.1874 40.6585 42.5101C36.8982 41.782 32.3594 41.5551 29.0373 42.5511L25.857 32.4113L30.7173 40.2565C33.4626 39.7427 36.5452 39.7364 39.7728 40.2407C38.2977 39.1722 37.371 39.0052 35.1709 38.2991C43.8041 38.2203 52.2418 46.3397 53.7642 53.7152L60.6575 53.2015L65.3948 44.9308C57.9342 37.1739 52.5349 29.1018 51.9581 21.1306L37.475 10.8174C36.7406 12.2799 36.52 13.8307 36.5704 15.4224C34.6131 12.8725 36.4727 9.39591 38.9091 4.79409C39.2937 4.03763 39.549 3.56799 37.8438 4.12273C33.1064 5.66718 29.5006 8.46609 27.392 11.5329C12.4297 18.1079 5.22128 28.1594 2.94558 37.7633L2.52322 41.0917C2.17966 39.1249 2 37.1014 2 35.0369C2 15.6872 17.684 0 37.0306 0ZM38.7925 10.975L42.2565 13.5218C42.7419 12.3997 44.0468 10.7828 45.9884 9.54405C46.6881 9.16267 46.9434 8.69934 45.2886 8.85378C42.9247 9.07126 40.2014 10.4045 38.7925 10.975ZM61.5369 48.1962L59.9483 43.3359L57.9752 43.9001L58.2179 46.3145C59.4188 44.8898 59.9231 46.6927 61.5369 48.1962ZM38.118 21.8208C41.0808 23.381 40.8665 23.8255 41.0966 26.7505L44.135 28.7173L45.919 29.1396L47.7787 31.1348C45.2697 27.1066 43.5015 23.1573 38.118 21.8208Z"
          />
        </svg>

        {/* Badge for "Only 1 left" */}
        {incompleteTasks > 0 && !isOpen && (
          <span className="absolute -top-2 right-0 z-20 flex size-6 items-center justify-center rounded-full bg-white px-2 py-1 text-xs font-bold text-blue-600">
            {incompleteTasks}
          </span>
        )}

        {/* Expanding Circle */}
        <div
          className={cn(
            'absolute inset-0 z-0 rounded-full bg-blue-600 transition-all duration-500 ease-in-out',
            isOpen ? 'scale-[4] opacity-100' : 'scale-0 opacity-0'
          )}
        />
      </button>

      {/* Menu */}
      <div
        className={cn(
          'absolute bottom-24 right-0 w-72 rounded-lg bg-white p-4 shadow-lg transform transition-all duration-500 ease-in-out',
          isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-75 opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {incompleteTasks === 0 ? (
          <div className="text-center">
            <CheckCircleIcon className="mx-auto mb-4 size-12 text-green-500" />
            <p className="text-xl font-bold text-green-500">Great job!</p>
            <p className="text-md text-gray-700">
              You&apos;re all finished setting up!
            </p>
            <button
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
              onClick={handleConfetti}
            >
              Dismiss
            </button>
          </div>
        ) : (
          <>
            <p className="text-xl font-bold">Hands-free Pilot</p>
            {ctaItems.map((cta, index) => (
              <div
                key={index}
                className={cn(
                  'flex cursor-pointer items-center space-x-4 transition-all duration-200 p-2 rounded-lg',
                  cta.isCompleted ? '' : 'animate-pulse'
                )}
                onClick={cta.action}
              >
                <div>
                  {cta.isCompleted ? (
                    <CheckCircleIcon className="size-6 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="size-6 text-yellow-500" />
                  )}
                </div>
                <p
                  className={`flex-1 font-semibold ${cta.isCompleted ? 'text-green-500' : 'text-yellow-500'}`}
                >
                  {cta.label}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default OnboardingChecklist;
