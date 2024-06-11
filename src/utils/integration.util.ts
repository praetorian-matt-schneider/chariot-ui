export const getChariotWebhookURL = ({ api = '', me = '', pin = '' }) => {
  const username = btoa(me);
  const encodedUsername = username.replace(/=+$/, '');
  return `${api}/hook/${encodedUsername}/${pin}`;
};
