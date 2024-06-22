import React, { useMemo } from 'react';
import { InformationCircleIcon } from '@heroicons/react/20/solid';

import { Tooltip } from '@/components/Tooltip';

export interface Breadcrumb {
  label: string;
  order: number;
  to?: string;
}

const getDescription = (label: string): string => {
  switch (label?.toLowerCase()) {
    case 'jobs':
      return 'Jobs are scheduled or on-demand tasks that perform specific actions, such as scanning assets, monitoring activities, or running security assessments to identify vulnerabilities and threats.';
    case 'seeds':
      return 'A seed is a starting point for monitoring, such as a domain, IP address, CIDR range, or GitHub organization.';
    case 'assets':
      return 'An asset is any resource discovered from your seeds, such as servers, databases, applications, subdomains, and repositories.';
    case 'risks':
      return 'A risk is a potential security threat or vulnerability identified within your assets that needs to be prioritized and mitigated.';
    case 'integrations':
      return 'Integrations are connections to external platforms and services, like GitHub, AWS, and Google Cloud, that enhance visibility and improve monitoring and risk detection capabilities.';
    case 'dashboard':
      return 'Get insights into your attack surface with metrics on monitoring activities, identified assets, and detected risks.';
    default:
      return '';
  }
};

export function BreadCrumbs({ breadcrumbs }: { breadcrumbs: Breadcrumb[] }) {
  const description = useMemo(
    () => getDescription(breadcrumbs[breadcrumbs.length - 1].label),
    [breadcrumbs]
  );
  return (
    <>
      <ul className="flex min-h-[104px] items-center py-9">
        {breadcrumbs.map((breadcrumb, idx) => {
          return (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <li className="mx-2 hidden text-2xl font-extralight text-default-light sm:inline">
                  /
                </li>
              )}
              <li
                className={`text-2xl font-bold ${idx === 0 && 'hidden sm:inline'}`}
              >
                {breadcrumb.label}
              </li>
            </React.Fragment>
          );
        })}
        {description.length > 0 && (
          <li>
            <Tooltip title={description} placement="left">
              <InformationCircleIcon className=" ml-2 size-6 text-indigo-300" />
            </Tooltip>
          </li>
        )}
      </ul>
    </>
  );
}
