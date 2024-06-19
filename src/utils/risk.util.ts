import { Secret } from '../types';

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
// Function to check if the file object is a valid nuclei template and process it.
function processNucleiTemplate(file: Partial<NucleiTemplate>): string {
  // Helper function to create formatted sections.
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

const getSeverityClass = (key: string) => {
  switch (key) {
    case 'I':
      return `border-gray-200`;
    case 'L':
      return `bg-indigo-100 border-indigo-200 text-indigo-800`;
    case 'M':
      return `bg-amber-100 border-amber-200 text-amber-800`;
    case 'H':
      return `bg-pink-100 border-pink-200 text-pink-800`;
    case 'C':
      return `bg-red-100 border-red-200 text-red-800`;
    default:
      return ``;
  }
};

const getDescription = (file: unknown) => {
  if (isNucleiTemplate(file)) {
    return processNucleiTemplate(file as Partial<NucleiTemplate>);
  } else if (typeof file === 'object' && file !== null && 'matches' in file) {
    const secret: Secret = file as Secret;
    const output = secret.matches
      .map(match => {
        const secret = match.snippet.matching;
        const provenanceInfo = match.provenance
          .map(prov => {
            return `Repository Path: ${prov.repo_path}
    Blob Path: ${prov.blob_path}
    First Commit:
      - ID: ${prov.first_commit.commit_metadata.commit_id}
      - Author: ${prov.first_commit.commit_metadata.author_name} (${prov.first_commit.commit_metadata.author_email})
      - Message: ${prov.first_commit.commit_metadata.message.trim().split('\n')[0]}...`; // Using just the first line of the commit message for brevity
          })
          .join('\n');

        const locationInfo = `Location:
      - Blob ID: ${match.blob_id}
      - Offset: ${match.location.offset_span.start} to ${match.location.offset_span.end}
      - Source Code: Line ${match.location.source_span.start.line}, Column ${match.location.source_span.start.column} to Line ${match.location.source_span.end.line}, Column ${match.location.source_span.end.column}`;

        const matchInfo = `Matching Snippet:
      - Before: ${match.snippet.before.trim().split('\n').slice(-1)[0]}...
      - Match: ${match.snippet.matching}
      - After: ...${match.snippet.after.trim().split('\n')[0]}`;

        const additionalInfo = `Rule:
      - Name: ${match.rule_name}
      - ID: ${match.rule_text_id}
    Score: ${match.score || 'N/A'}
    Comment: ${match.comment || 'None'}
    Status: ${match.status || 'N/A'}`;

        return `# ==================
# SECRET
# =======
${secret}

# ==================
# PROVENANCE
# =======
${provenanceInfo}
    
# ==================
# LOCATION
# =======
${locationInfo}
    
# ==================
# MATCH
# =======
${matchInfo}
    
# ==================
# ADDITIONAL
# =======
${additionalInfo}
`;
      })
      .join('\n');
    return output;
  } else if (file !== undefined) {
    if (typeof file === 'object') {
      const _replacer = null;
      const numOfSpaces = 4;
      return JSON.stringify(file, _replacer, numOfSpaces);
    } else {
      return file?.toString() || '';
    }
  }

  return '';
};

export { getDescription, getSeverityClass };
