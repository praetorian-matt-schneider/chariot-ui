export const prettyPrint = (str: string) => {
  switch (str) {
    case 'amazon':
      return 'Amazon Web Services';
    case 'gcp':
      return 'Google Cloud';
    case 'azure':
      return 'Microsoft Azure';
    case 'tcp':
    case 'udp':
      return str.toUpperCase();
    default:
      return str.charAt(0).toUpperCase() + str.slice(1);
  }
};
