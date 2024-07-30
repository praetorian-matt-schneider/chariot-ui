import { Amplify } from 'aws-amplify';

export const initAmplify = ({
  clientId,
  userPoolId,
  backend,
  region,
  api,
}: {
  clientId: string;
  userPoolId: string;
  backend: string;
  region: string;
  api: string;
}) => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolClientId: clientId,
        userPoolId,

        loginWith: {
          oauth: {
            domain: `praetorian-${backend}.auth.${region}.amazoncognito.com`,
            scopes: ['email', 'openid'],
            redirectSignIn: [
              'https://localhost:3000/hello',
              'https://preview.chariot.praetorian.com/hello',
            ],
            redirectSignOut: [
              'https://localhost:3000/goodbye',
              'https://preview.chariot.praetorian.com/goodbye',
            ],
            responseType: 'code',
          },
        },
      },
    },
    API: {
      REST: {
        [backend]: {
          endpoint: api,
          region,
        },
      },
    },
  });
};
