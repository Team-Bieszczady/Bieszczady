import { IoSearchOutline } from 'react-icons/io5';
import { Select } from '../../../components/ui/Select';
import { INPUT_CLASSES } from '../../../components/ui/formStyles';
import { DOCUMENT_KINDS_OPTIONS } from '../../../lib/documents';

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  kind: string;
  onKindChange: (value: string) => void;
}

export function DocumentsToolbar({
  query,
  onQueryChange,
  kind,
  onKindChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-0 flex-1 sm:max-w-64">
        <IoSearchOutline className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Szukaj w tym folderze..."
          aria-label="Szukaj w tym folderze"
          className={`${INPUT_CLASSES} pl-9`}
        />
      </div>

      <div className="w-40 shrink-0">
        <Select
          size="md"
          options={DOCUMENT_KINDS_OPTIONS}
          placeholder="Rodzaj"
          value={kind}
          onChange={onKindChange}
        />
      </div>
    </div>
  );
}
