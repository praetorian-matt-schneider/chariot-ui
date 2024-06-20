import {
  Link as ReactRouterLink,
  LinkProps as ReactRouterLinkProps,
} from 'react-router-dom';

import { Button, ButtonProps } from '@/components/Button';

export interface LinkProps
  extends ReactRouterLinkProps,
    Pick<ButtonProps, 'styleType'> {
  newTab?: boolean;
  buttonClass?: string;
}

export function Link(props: LinkProps) {
  const {
    styleType = 'textPrimary',
    newTab,
    buttonClass,
    ...linkProps
  } = props;

  const isNewTab =
    newTab ||
    (typeof linkProps.to === 'string' && linkProps.to.startsWith('http'));

  return (
    <ReactRouterLink
      {...linkProps}
      {...(isNewTab
        ? {
            target: '_blank',
            rel: 'noreferrer',
          }
        : {})}
    >
      <Button styleType={styleType} className={buttonClass}>
        {props.children}
      </Button>
    </ReactRouterLink>
  );
}
