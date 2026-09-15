import { useState } from 'react';
import toast from 'react-hot-toast';
import { SlTrash } from 'react-icons/sl';
import { IoArchiveOutline, IoRefreshOutline } from 'react-icons/io5';
import {
  ActionMenu,
  type ActionMenuItem,
} from '../../../components/ui/ActionMenu';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import {
  useArchiveProject,
  useDeleteProject,
  useRestoreProject,
} from '../hooks/useProjectsApi';
import type { BackendProjectCard } from '../../../lib/projectsApi';

type PendingAction = 'archive' | 'restore' | 'delete' | null;

interface ProjectCardActionsProps {
  project: BackendProjectCard;
}

export default function ProjectCardActions({
  project,
}: ProjectCardActionsProps) {
  const archive = useArchiveProject();
  const restore = useRestoreProject();
  const remove = useDeleteProject();
  const [pending, setPending] = useState<PendingAction>(null);

  const isArchived = project.archivedAt !== null;
  const close = () => setPending(null);
  const fail = (error: Error) =>
    toast.error(error.message, { id: error.message });

  const items: ActionMenuItem[] = isArchived
    ? [
        {
          id: 'restore',
          label: 'Przywróć',
          icon: <IoRefreshOutline className="h-3.5 w-3.5" aria-hidden="true" />,
          onSelect: () => setPending('restore'),
        },
        {
          id: 'delete',
          label: 'Usuń',
          tone: 'danger',
          icon: <SlTrash className="h-3.5 w-3.5" aria-hidden="true" />,
          onSelect: () => setPending('delete'),
        },
      ]
    : [
        {
          id: 'archive',
          label: 'Archiwizuj',
          icon: <IoArchiveOutline className="h-3.5 w-3.5" aria-hidden="true" />,
          onSelect: () => setPending('archive'),
        },
        {
          id: 'delete',
          label: 'Usuń',
          tone: 'danger',
          icon: <SlTrash className="h-3.5 w-3.5" aria-hidden="true" />,
          onSelect: () => setPending('delete'),
        },
      ];

  return (
    <div
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <ActionMenu items={items} ariaLabel="Akcje projektu" />

      <ConfirmDialog
        isOpen={pending === 'archive'}
        onClose={close}
        onConfirm={() =>
          archive.mutate(project.id, {
            onSuccess: () => {
              toast.success('Projekt zarchiwizowany');
              close();
            },
            onError: fail,
          })
        }
        title="Zarchiwizować projekt?"
        description={`${project.name} trafi do Archiwum i stanie się tylko do odczytu. Możesz go później przywrócić.`}
        confirmLabel="Archiwizuj"
        tone="danger"
        isPending={archive.isPending}
      />

      <ConfirmDialog
        isOpen={pending === 'restore'}
        onClose={close}
        onConfirm={() =>
          restore.mutate(project.id, {
            onSuccess: () => {
              toast.success('Projekt przywrócony');
              close();
            },
            onError: fail,
          })
        }
        title="Przywrócić projekt?"
        description={`${project.name} wróci na listę projektów i znów będzie można go edytować.`}
        confirmLabel="Przywróć"
        isPending={restore.isPending}
      />

      <ConfirmDialog
        isOpen={pending === 'delete'}
        onClose={close}
        onConfirm={() =>
          remove.mutate(
            { id: project.id, archivedAt: project.archivedAt },
            {
              onSuccess: () => {
                toast.success('Projekt usunięty');
                close();
              },
              onError: fail,
            },
          )
        }
        title="Usunąć projekt na stałe?"
        description={`${project.name} i wszystkie jego etapy, działania, zadania, cele, ryzyka i zespół zostaną trwale usunięte. Tej operacji nie można cofnąć.`}
        confirmLabel="Usuń"
        tone="danger"
        isPending={remove.isPending}
      />
    </div>
  );
}
