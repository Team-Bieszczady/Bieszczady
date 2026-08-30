import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import {
  MODULES,
  MODULE_LABELS,
  fromModuleFlags,
  toModuleFlags,
  type ModuleFlags,
  type ModuleKey,
} from '../../../lib/modules';
import { useUpdateUserModules } from '../hooks/useUpdateUserModules';

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
      toast.error('Nie udało się zaktualizować dostępu. Spróbuj ponownie.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Zarządzaj dostępem: ${userName}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {MODULES.map((module) => (
            <Controller
              key={module}
              name={`modules.${module}`}
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name={field.name}
                    ref={field.ref}
                    checked={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">
                    {MODULE_LABELS[module]}
                  </span>
                </label>
              )}
            />
          ))}
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
