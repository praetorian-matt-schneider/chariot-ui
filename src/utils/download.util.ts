type FileType = 'json' | 'csv';
type Json = Record<string, string>[];

export const exportContent = async (
  data: unknown | Json,
  fileName = 'data',
  fileType: FileType = 'json'
) => {
  const downloadedContent =
    fileType === 'json'
      ? JSON.stringify(data, null, 2)
      : convertJSONToCSV(data as Json);
  const type = fileType === 'json' ? 'application/json' : 'text/csv';
  const href = `data:${type};charset=utf-8,${encodeURIComponent(downloadedContent)}`;

  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.setAttribute('download', fileName);
  a.setAttribute('type', fileType);

  a.click();
  URL.revokeObjectURL(href);
};

const convertJSONToCSV = (json: Json = []) => {
  try {
    if (json.length > 0 && json[0] && Object.keys(json[0]).length > 0) {
      const keys = Object.keys(json[0]);
      const csvData = json.map(row =>
        keys
          .map(key => {
            const value = row[key];
            if (!value) {
              return '';
            }
            if (typeof value === 'object') {
              return `"${JSON.stringify(value).replaceAll('"', '""')}"`; // Escape double quotes so that JSON is kept as a single cell
            }
            return `"${value}"`;
          })
          .join(',')
      );
      return [keys.join(','), ...csvData].join('\r\n');
    }
    return '';
  } catch (error) {
    console.error('Error converting JSON to CSV', error);
    return '';
  }
};
