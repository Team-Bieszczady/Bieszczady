import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import {
  MODULES,
  MODULE_LABELS,
  applyModuleDependencies,
  fromModuleFlags,
  toModuleFlags,
  type ModuleFlags,
  type ModuleKey,
} from '../../../lib/modules';
import { useUpdateUserModules } from '../hooks/useUpdateUserModules';
import { useUserProjects } from '../../projects/hooks/useProjectsApi';
import { PROJECT_ROLE_LABELS } from '../../projects/labels';

interface ManageModuleAccessModalProps {
  userId: string;
  userName: string;
  currentModules: ModuleKey[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageModuleAccessModal({
  userId,
  userName,
  currentModules,
  isOpen,
  onClose,
}: ManageModuleAccessModalProps) {
  const { control, handleSubmit, reset } = useForm<{ modules: ModuleFlags }>({
    defaultValues: { modules: toModuleFlags(currentModules) },
  });

  const mutation = useUpdateUserModules(userId);
  const projects = useUserProjects(userId, isOpen);

  useEffect(() => {
    if (isOpen) {
      reset({ modules: toModuleFlags(currentModules) });
    }
  }, [isOpen, currentModules, reset]);

  const onSubmit = async (data: { modules: ModuleFlags }) => {
    try {
      await mutation.mutateAsync(fromModuleFlags(data.modules));
      toast.success(`Dostęp do modułów dla ${userName} został zaktualizowany`);
      onClose();
    } catch {
      toast.error('Nie udało się zaktualizować dostępu. Spróbuj ponownie.', {
        id: 'module-access-error',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Zarządzaj dostępem: ${userName}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="modules"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-4">
              {MODULES.map((module) => (
                <label
                  key={module}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={field.value[module]}
                    onChange={(event) =>
                      field.onChange(
                        applyModuleDependencies(
                          field.value,
                          module,
                          event.target.checked,
                        ),
                      )
                    }
                    onBlur={field.onBlur}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">
                    {MODULE_LABELS[module]}
                  </span>
                </label>
              ))}
            </div>
          )}
        />

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-semibold text-gray-700">Projekty</p>
          <p className="mt-0.5 text-[11px] text-mutedText">
            Dostęp w projekcie zmienisz w Przegląd → Zespół.
          </p>
          {projects.data?.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Nie należy do żadnego projektu.
            </p>
          )}
          <ul className="mt-2 divide-y divide-gray-100">
            {projects.data?.map((project) => (
              <li key={project.projectId} className="py-2">
                <p className="text-sm text-gray-700">
                  {project.projectName}
                  <span className="text-gray-500">
                    {' · '}
                    {PROJECT_ROLE_LABELS[project.projectRole]}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {project.modules.length > 0
                    ? project.modules
                        .map((module) =>
                          module === 'BUDGET'
                            ? `${MODULE_LABELS[module]} (${project.canEditBudget ? 'edycja' : 'podgląd'})`
                            : MODULE_LABELS[module],
                        )
                        .join(', ')
                    : 'Tylko Przegląd'}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button
            type="button"
            variant="ghost"
            size="small"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Anuluj
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="small"
            isPending={mutation.isPending}
          >
            Zapisz
          </Button>
        </div>
      </form>
    </Modal>
  );
}
