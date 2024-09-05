import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';

import OnboardingChecklist from '@/components/OnboardingChecklist';
import { ShortcutsHelper } from '@/components/ui/Shortcuts';
import { useMy } from '@/hooks';
import { useGetAccountDetails } from '@/hooks/useAccounts';
import { useGetRootDomain } from '@/hooks/useAttribute';
import { useIntegration } from '@/hooks/useIntegration';
import { AddAsset } from '@/sections/add/AddAsset';
import { AddFile } from '@/sections/add/AddFile';
import { AddRisks } from '@/sections/add/AddRisks';
import { DetailsDrawer } from '@/sections/detailsDrawer';
import { LinkAWS } from '@/sections/LinkAWS';
import { NewUserSeedModal } from '@/sections/NewUserSeedModal';
import { ProofOfExploit } from '@/sections/ProofOfExploit';
import { TopNavBar } from '@/sections/topNavBar/TopNavBar';
import { UpgradeModal } from '@/sections/Upgrade';
import { useAuth } from '@/state/auth';
import { useBreadCrumbsContext } from '@/state/breadcrumbs';
import { cn } from '@/utils/classname';
import { useGetScreenSize } from '@/utils/misc.util';
import { Regex } from '@/utils/regex.util';
import { getRoute } from '@/utils/route.util';
import { useSticky } from '@/utils/sticky.util';

const offsetViewMargin = 16;
interface AuthenticatedApp {
  children: ReactNode;
}

function AuthenticatedAppComponent(props: AuthenticatedApp) {
  const { children } = props;

  const headerRef = useRef<HTMLDivElement>(null);

  const { useBreadCrumb } = useBreadCrumbsContext();
  const { me, friend } = useAuth();

  const { data: accounts } = useMy({
    resource: 'account',
  });

  const { name: displayName } = useGetAccountDetails(accounts);

  const navigate = useNavigate();
  const [shortcutsHelper, setShortcutsHelper] = useState(false);

  // @types/node
  let timeout: NodeJS.Timeout;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      resetShortcuts();
      if (event.ctrlKey && event.key) {
        switch (event.key) {
          case 'a':
          case 'A':
            navigate(getRoute(['app', 'assets']));
            break;
          case 'r':
          case 'R':
            navigate(getRoute(['app', 'risks']));
            break;
          case 'j':
          case 'J':
            navigate(getRoute(['app', 'jobs']));
            break;
        }

        timeout = setTimeout(() => {
          setShortcutsHelper(true);
        }, 1500);
      }
    }

    function resetShortcuts() {
      setShortcutsHelper(false);
      timeout && clearTimeout(timeout);
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', resetShortcuts);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', resetShortcuts);
    };
  }, []);

  useBreadCrumb({
    label: displayName || friend || me,
    order: 1,
  });

  const {
    data: { riskNotificationStatus, attackSurfaceStatus },
  } = useIntegration();
  const { data: alerts } = useMy({
    resource: 'condition',
  });
  const { data: rootDomain } = useGetRootDomain();
  const hasCustomAttributes = useMemo(() => {
    return alerts.some(alert => alert.key.match(Regex.CUSTOM_ALERT_KEY));
  }, [alerts]);

  return (
    <div
      className={'flex h-full flex-col items-center overflow-hidden bg-layer1'}
    >
      <div
        className="grow-1 flex size-full justify-center"
        style={{
          maxHeight: `calc(100% - ${(headerRef.current?.clientHeight || 0) - offsetViewMargin}px)`,
        }}
      >
        {children}
      </div>
      {shortcutsHelper && (
        <ShortcutsHelper onClose={() => setShortcutsHelper(false)} />
      )}
      <DetailsDrawer />
      <NewUserSeedModal />
      <ProofOfExploit />
      <AddRisks />
      <AddAsset />
      <AddFile />
      <UpgradeModal />
      <LinkAWS />
      <OnboardingChecklist
        rootDomain={rootDomain}
        attackSurfacesConfigured={riskNotificationStatus}
        notificationsConfigured={attackSurfaceStatus}
        exposureAlertsConfigured={hasCustomAttributes}
        risksRemediated={1}
      />
    </div>
  );
}

export const HeaderPortalSections = {
  BREADCRUMBS: 'header-breadcrumbs-section',
  EXTRA_CONTENT: 'header-extra-content-section',
};

export function Header() {
  const location = useLocation();
  const { useCreateSticky } = useSticky();
  const screenSize = useGetScreenSize();

  // TODO: FIXME - this is a hack to not show sticky header on table pages
  const showSticky =
    !screenSize.maxMd &&
    ['assets', 'risks', 'jobs'].includes(location.pathname.split('/')[2]);

  const stickyRef = useCreateSticky<HTMLDivElement>({
    id: '1',
    offset: -16,
    notSticky: !showSticky,
  });

  return (
    <>
      <div
        className={cn(
          `flex flex-col items-center w-full bg-header text-header`
        )}
      >
        <div className="w-full max-w-screen-xl px-4">
          <TopNavBar />
        </div>
      </div>
      <div
        ref={stickyRef}
        className={cn('w-full bg-header pt-4', showSticky && 'sticky')}
        style={{ zIndex: 1, top: 0 }}
      >
        <div
          id={HeaderPortalSections.EXTRA_CONTENT}
          className="m-auto max-w-screen-xl px-4 text-[10px] [&:has(*)]:pb-7"
        />
      </div>
    </>
  );
}

export function RenderHeaderBreadcrumbSection({
  children,
}: {
  children: ReactNode;
}) {
  const BreadcrumbSection = document.getElementById(
    HeaderPortalSections.BREADCRUMBS
  );

  if (!BreadcrumbSection) {
    return null;
  }

  return createPortal(children, BreadcrumbSection);
}

export function RenderHeaderExtraContentSection({
  children,
}: {
  children: ReactNode;
}) {
  const ExtraContentSection = document.getElementById(
    HeaderPortalSections.EXTRA_CONTENT
  );

  if (!ExtraContentSection) {
    return null;
  }

  return createPortal(children, ExtraContentSection);
}

function AuthenticatedAppProviders(props: { children: ReactNode }) {
  return props.children;
}

export function AuthenticatedApp(props: AuthenticatedApp) {
  return (
    <AuthenticatedAppProviders>
      <AuthenticatedAppComponent {...props} />
    </AuthenticatedAppProviders>
  );
}
