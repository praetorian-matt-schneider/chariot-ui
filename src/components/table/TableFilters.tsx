import { createPortal } from 'react-dom';

interface TableFiltersProps {
  filters?: JSX.Element;
}

export function TableFilters(props: TableFiltersProps) {
  const { filters } = props;
  const filtersElement = document.getElementById('table-filters');

  if (!filters) {
    return null;
  }

  if (!filtersElement) {
    return null;
  }

  return createPortal(<div className="mb-9">{filters}</div>, filtersElement);
}
