export const getChariotWebhookURL = ({ api = '', me = '', pin = '' }) => {
  const username = btoa(me);
  const encodedUsername = username.replace(/=+$/, '');
  if (!api || !encodedUsername || !pin) {
    return '';
  }
  return `${api}/hook/${encodedUsername}/${pin}`;
};
