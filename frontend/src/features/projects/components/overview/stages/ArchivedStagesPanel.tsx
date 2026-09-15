import { useId, useState } from 'react';
import { FiChevronDown, FiTrash2 } from 'react-icons/fi';
import type { Stage } from '../../../types';
import { formatStageDate } from '../../../utils/isoDate';

interface ArchivedStagesPanelProps {
  stages: Stage[];
  canEdit: boolean;
  onRestore: (stage: Stage) => void;
  onDelete: (stage: Stage) => void;
}

export default function ArchivedStagesPanel({
  stages,
  canEdit,
  onRestore,
  onDelete,
}: ArchivedStagesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const listId = useId();

  if (stages.length === 0) return null;

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={listId}
        className="flex cursor-pointer items-center gap-1.5 rounded-md text-xs font-semibold text-grayText transition-colors hover:text-dark focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none"
      >
        <FiChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
        Zarchiwizowane etapy ({stages.length})
      </button>

      {isOpen && (
        <ul id={listId} className="animate-fade-in mt-2.5 flex flex-col gap-2">
          {stages.map((stage) => (
            <li
              key={stage.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 transition-colors hover:bg-gray-50"
            >
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-dark">
                {stage.name}
              </span>
              <span className="shrink-0 text-[11px] text-mutedText max-500:hidden">
                {formatStageDate(stage.deadline)}
              </span>

              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={() => onRestore(stage)}
                    aria-label={`Przywróć etap ${stage.name}`}
                    className="shrink-0 cursor-pointer rounded-md px-2 py-1 text-[11px] font-semibold text-darkGreen transition-colors hover:bg-lightGreen/60 focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none"
                  >
                    Przywróć
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(stage)}
                    aria-label={`Usuń trwale etap ${stage.name}`}
                    className="shrink-0 cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-darkRed focus-visible:ring-1 focus-visible:ring-darkRed focus-visible:outline-none"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
