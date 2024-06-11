import React from 'react';

export interface Breadcrumb {
  label: string;
  order: number;
  to?: string;
}

export function BreadCrumbs({ breadcrumbs }: { breadcrumbs: Breadcrumb[] }) {
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
      </ul>
    </>
  );
}
