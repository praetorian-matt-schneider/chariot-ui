import { Risk } from '@/types';
import { getRiskSeverity } from '@/utils/riskStatus.util';

export function sortBySeverityAndUpdated(array: Risk[]) {
  const severityOrder = { C: 0, H: 1, M: 2, L: 3, I: 4 };

  return array.sort(
    (
      a: { status: string | undefined; updated: string | number | Date },
      b: { status: string | undefined; updated: string | number | Date }
    ) => {
      // First sort by severity
      const severityA = a.status ? severityOrder[getRiskSeverity(a.status)] : 4; // Default to "I" if status is missing
      const severityB = b.status ? severityOrder[getRiskSeverity(b.status)] : 4;

      if (severityA !== severityB) {
        return severityA - severityB;
      }

      // Then sort by updated date, most recent first
      const dateA = new Date(a.updated);
      const dateB = new Date(b.updated);

      return dateB.getTime() - dateA.getTime();
    }
  );
}
