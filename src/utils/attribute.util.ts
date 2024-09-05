import { Regex } from '@/utils/regex.util';

export const getAlertName = (attribute: string) => {
  const [, attributeName = '', attributeValue = ''] =
    attribute.match(Regex.ATTIBUTE_KEY) || [];

  return `exposure-${attributeName}-${attributeValue.split('#')[0]}`;
};
