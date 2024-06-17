import {
  Link as ReactRouterLink,
  LinkProps as ReactRouterLinkProps,
} from 'react-router-dom';

import { Button, ButtonProps } from '@/components/Button';

export interface LinkProps
  extends ReactRouterLinkProps,
    Pick<ButtonProps, 'styleType'> {
  newTab?: boolean;
}

export function Link(props: LinkProps) {
  const { styleType = 'textPrimary', newTab, ...linkProps } = props;

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
      <Button styleType={styleType}>{props.children}</Button>
    </ReactRouterLink>
  );
}
