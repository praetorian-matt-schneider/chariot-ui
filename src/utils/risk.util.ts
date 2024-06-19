import yaml from 'js-yaml';

interface NucleiTemplate {
  'curl-command': string;
  request: string;
  'template-encoded': string;
  response: string;
  'extracted-results'?: string[];
}

function isNucleiTemplate(file: unknown): file is Partial<NucleiTemplate> {
  return typeof file === 'object' && file !== null && 'template-id' in file;
}

function processNucleiTemplate(file: Partial<NucleiTemplate>): string {
  const formatSection = (
    title: string,
    content: string
  ) => `# ==================
# ${title.toUpperCase()}
# =======
${content}`;

  const rule = file['template-encoded']
    ? formatSection('rule', atob(file['template-encoded']))
    : '';
  const extractedResults =
    file['extracted-results'] && Array.isArray(file['extracted-results'])
      ? formatSection('extracted results', file['extracted-results'].join('\n'))
      : '';
  const command = formatSection(
    'command',
    file?.['curl-command']?.trim() ?? ''
  );
  const request = formatSection('request', file?.request?.trim() ?? '');
  const response = formatSection('response', file?.response?.trim() ?? '');

  return [rule, extractedResults, command, request, response]
    .filter(section => section.trim() !== '')
    .join('\n\n');
}

const getDescription = (file: unknown): string => {
  if (isNucleiTemplate(file)) {
    return processNucleiTemplate(file as Partial<NucleiTemplate>);
  } else if (typeof file === 'object' && file !== null) {
    // Function to format the entire data with a header
    const formatWithHeaders = (data: unknown, title: string): string => {
      return `# ==================
# ${title.toUpperCase()}
# ==================
${yaml.dump(data, { noRefs: true, skipInvalid: true })}`;
    };

    // Function to iterate over keys and create sections if applicable
    const createSections = (data: unknown): string => {
      if (typeof data !== 'object' || data === null) {
        return yaml.dump(data);
      }

      const entries = Object.entries(data as Record<string, unknown>);
      const sections = entries.map(([key, value]) =>
        formatWithHeaders(value, key)
      );

      return sections.join('\n');
    };

    // Create sections for the parsed file
    return createSections(file);
  } else if (file !== undefined) {
    if (typeof file === 'object') {
      return yaml.dump(file, { noRefs: true, skipInvalid: true });
    } else {
      return file?.toString() || '';
    }
  }

  return '';
};

export { getDescription };
