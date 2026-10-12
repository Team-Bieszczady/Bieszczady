import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Select, type SelectOption } from '../../../components/ui/Select';
import { useProjects } from '../../projects/hooks/useProjectsApi';
import { useProjectParticipantsExport } from '../hooks/useProjectParticipantsExport';

function byName(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name, 'pl');
}

interface ProjectParticipantsExportModalProps {
  onClose: () => void;
}

export function ProjectParticipantsExportModal({
  onClose,
}: ProjectParticipantsExportModalProps) {
  const [projectId, setProjectId] = useState('');
  const projectsQuery = useProjects(true);
  const { exportProject, isExporting } = useProjectParticipantsExport();

  // Grant rozlicza się zwykle po zakończeniu projektu, więc projekty
  // z archiwum też muszą być na liście.
  const projects = projectsQuery.data || [];
  const activeOptions: SelectOption[] = projects
    .filter((project) => project.archivedAt === null)
    .sort(byName)
    .map((project) => ({ value: project.id, label: project.name }));
  const archivedOptions: SelectOption[] = projects
    .filter((project) => project.archivedAt !== null)
    .sort(byName)
    .map((project) => ({
      value: project.id,
      label: `${project.name} (w archiwum)`,
    }));
  const projectOptions = activeOptions.concat(archivedOptions);

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
          {projectsQuery.isError && (
            <p role="alert" className="mt-2 text-xs text-darkRed">
              {projectsQuery.error.message}
            </p>
          )}
          {projectsQuery.isSuccess && projectOptions.length === 0 && (
            <p className="mt-2 text-xs text-grayText">
              Nie należysz jeszcze do żadnego projektu.
            </p>
          )}
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
