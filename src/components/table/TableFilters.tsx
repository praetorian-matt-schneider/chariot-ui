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

  return createPortal(
    <>
      <hr className="h-px bg-layer0 opacity-15" />
      <div className="mb-9 mt-4">{filters}</div>
    </>,
    filtersElement
  );
}
