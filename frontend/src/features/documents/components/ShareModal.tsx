import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { useDocumentAccess } from '../hooks/useDocumentAccess';
import { useGrantAccess } from '../hooks/useGrantAccess';
import { useRevokeAccess } from '../hooks/useRevokeAccess';
import { showError, showSuccess } from '../utils/toasts';

type Level = 'NONE' | 'VIEW' | 'EDIT';

const LEVEL_OPTIONS = [
  { value: 'NONE', label: 'Bez ustawienia' },
  { value: 'VIEW', label: 'Podgląd' },
  { value: 'EDIT', label: 'Edycja' },
];

const LEVEL_LABELS: Record<'VIEW' | 'EDIT', string> = {
  VIEW: 'Podgląd',
  EDIT: 'Edycja',
};

interface Props {
  projectId: string;
  target: { folderId?: string; documentId?: string };
  targetName?: string;
  onClose: () => void;
}

export function ShareModal({ projectId, target, targetName, onClose }: Props) {
  const { data: rows } = useDocumentAccess(projectId, target);
  const grant = useGrantAccess(projectId);
  const revoke = useRevokeAccess(projectId);

  const isOpen = Boolean(target.folderId || target.documentId);

  const changeLevel = (
    row: { userId: string; accessId: string | null },
    newLevel: Level,
  ) => {
    if (!newLevel) {
      return;
    }

    if (newLevel === 'NONE') {
      if (!row.accessId) {
        return;
      }
      revoke.mutate(row.accessId, {
        onSuccess: () => showSuccess('Odebrano dostęp'),
        onError: showError,
      });
      return;
    }

    grant.mutate(
      { userId: row.userId, level: newLevel, ...target },
      {
        onSuccess: () => showSuccess('Zmieniono dostęp'),
        onError: showError,
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Udostępnij: ${targetName ?? ''}`}
    >
      <div className="space-y-4">
        {rows?.map((row) => (
          <div
            key={row.userId}
            className="flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-dark">
                {row.firstName} {row.lastName}
              </p>
              {!row.isManager && !row.level && row.effectiveLevel && (
                <p className="truncate text-xs text-gray-400">
                  obowiązuje: {LEVEL_LABELS[row.effectiveLevel]} z folderu
                  nadrzędnego
                </p>
              )}
            </div>

            {row.isManager ? (
              <span className="shrink-0 text-xs text-gray-400">
                zawsze ma dostęp
              </span>
            ) : (
              <div className="w-40 shrink-0">
                <Select
                  size="md"
                  allowEmpty={false}
                  options={LEVEL_OPTIONS}
                  placeholder="Wybierz"
                  value={row.level ?? 'NONE'}
                  onChange={(v) => changeLevel(row, v as Level)}
                />
              </div>
            )}
          </div>
        ))}

        <div className="border-t border-gray-200 pt-4 text-xs text-gray-400">
          <p>Dyrektor i koordynatorzy projektu mają dostęp zawsze.</p>
          <p>Bez ustawienia = dostęp może wynikać z folderu nadrzędnego.</p>
        </div>
      </div>
    </Modal>
  );
}
