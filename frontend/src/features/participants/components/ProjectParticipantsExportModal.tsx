import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Select, type SelectOption } from '../../../components/ui/Select';
import { useMeetingProjectOptions } from '../../calendar/hooks/useMeetingProjectOptions';
import { useProjectParticipantsExport } from '../hooks/useProjectParticipantsExport';

interface ProjectParticipantsExportModalProps {
  onClose: () => void;
}

export function ProjectParticipantsExportModal({
  onClose,
}: ProjectParticipantsExportModalProps) {
  const [projectId, setProjectId] = useState('');
  const projectOptionsQuery = useMeetingProjectOptions();
  const { exportProject, isExporting } = useProjectParticipantsExport();

  const projectOptions: SelectOption[] = (projectOptionsQuery.data ?? []).map(
    (project) => ({ value: project.id, label: project.name }),
  );

  const download = () => {
    if (!projectId) {
      return;
    }

    void exportProject(projectId);
  };

  return (
    <Modal isOpen onClose={onClose} title="Eksportuj uczestników projektu">
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-grayText">
          Pobierzesz listę osób, które były na spotkaniach w wybranym projekcie,
          razem z liczbą spotkań. Przyda się do rozliczenia grantu.
        </p>

        <div>
          <p className="mb-2 text-sm text-dark/80">Projekt</p>
          <Select
            size="md"
            placeholder="Wybierz projekt"
            options={projectOptions}
            value={projectId}
            onChange={setProjectId}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button
            variant="outline"
            size="small"
            type="button"
            onClick={onClose}
            disabled={isExporting}
          >
            Zamknij
          </Button>
          <Button
            variant="primary"
            size="small"
            type="button"
            onClick={download}
            disabled={!projectId}
            isPending={isExporting}
            className="font-medium!"
          >
            Pobierz CSV
          </Button>
        </div>
      </div>
    </Modal>
  );
}
