import { Controller, useForm, useWatch } from 'react-hook-form';
import { FieldError } from '../../../components/ui/FieldError';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { SlLock } from 'react-icons/sl';
import { IoCheckbox, IoSquareOutline } from 'react-icons/io5';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../components/ui/formStyles';
import { useCreateUser, type AddUserFormInputs } from '../hooks/useCreateUser';
import { generatePassword } from '../utils/generatePassword';
import {
  useAddMemberToProject,
  useProjects,
} from '../../projects/hooks/useProjectsApi';
import { PROJECT_ROLE_OPTIONS } from '../../projects/labels';
import {
  DEFAULT_USER_MODULES,
  MODULES,
  MODULE_LABELS,
  applyModuleDependencies,
  toModuleFlags,
} from '../../../lib/modules';
import { isApiError } from '../../../lib/api';
import { NAME_MAX_LENGTH, nameRules } from '../../../lib/nameValidation';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    control,
  } = useForm<AddUserFormInputs>({
    mode: 'onChange',
    defaultValues: {
      password: generatePassword(),
      modules: toModuleFlags(DEFAULT_USER_MODULES),
    },
  });

  const createUserMutation = useCreateUser();
  const assignMutation = useAddMemberToProject();
  const projects = useProjects(false, isOpen);
  const password = useWatch({ control, name: 'password' });
  const moduleFlags = useWatch({ control, name: 'modules' });

  const projectOptions = (projects.data ?? []).map((project) => ({
    value: project.id,
    label: project.name,
  }));

  const handleGeneratePassword = () => {
    setValue('password', generatePassword());
  };

  const finish = () => {
    queryClient.invalidateQueries({ queryKey: ['people'] });
    reset();
    onClose();
  };

  const onSubmit = (data: AddUserFormInputs) => {
    createUserMutation.mutate(data, {
      onSuccess: async (createdUser) => {
        toast.success('Użytkownik został stworzony pomyślnie!');
        if (data.projectId && data.role) {
          try {
            await assignMutation.mutateAsync({
              projectId: data.projectId,
              userId: createdUser.id,
              projectRole: data.role,
            });
            toast.success('Przypisano do projektu');
          } catch (error) {
            console.error();
            const message =
              error instanceof Error ? error.message : 'Coś poszło nie tak';
            toast.error(
              `Konto utworzone, ale nie przypisano do projektu: ${message}`,
            );
          }
        }

        finish();
      },
      onError: (error) => {
        const message = isApiError(error)
          ? error.message
          : 'Coś poszło nie tak';
        toast.error(message);
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dodaj użytkownika">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={FIELD_LABEL_CLASSES}>Imię</label>
            <input
              type="text"
              placeholder="Podaj.."
              maxLength={NAME_MAX_LENGTH}
              className={INPUT_CLASSES}
              {...register('firstName', nameRules('Imię'))}
            />
            <FieldError message={errors.firstName?.message} />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES}>Nazwisko</label>
            <input
              type="text"
              placeholder="Podaj.."
              maxLength={NAME_MAX_LENGTH}
              className={INPUT_CLASSES}
              {...register('lastName', nameRules('Nazwisko'))}
            />
            <FieldError message={errors.lastName?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={FIELD_LABEL_CLASSES}>
              Telefon{' '}
              <span className="font-normal text-gray-400">opcjonalnie</span>
            </label>
            <input
              type="tel"
              placeholder="+48 000 000 000"
              className={INPUT_CLASSES}
              {...register('phone')}
            />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES}>E-mail</label>
            <input
              type="email"
              placeholder="jan.kowalski@gmail.com"
              className={INPUT_CLASSES}
              {...register('email', {
                required: 'E-mail jest wymagany',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Podaj poprawny adres e-mail',
                },
              })}
            />
            <FieldError message={errors.email?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={FIELD_LABEL_CLASSES}>Rola w projekcie</label>
            <Controller
              name="role"
              control={control}
              rules={{
                validate: (value, values) =>
                  !values.projectId || !!value || 'Wybierz rolę w projekcie',
              }}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Wybierz"
                  options={PROJECT_ROLE_OPTIONS}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.role}
                />
              )}
            />
            <FieldError message={errors.role?.message} />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES}>Przypisz do projektu</label>
            <Controller
              name="projectId"
              control={control}
              rules={{
                validate: (value, values) =>
                  !values.role || !!value || 'Wybierz projekt',
              }}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder={projects.isLoading ? 'Ładowanie...' : 'Wybierz'}
                  options={projectOptions}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.projectId}
                />
              )}
            />
            <FieldError message={errors.projectId?.message} />
          </div>
        </div>

        <div className="border-t border-gray-200" />

        <div>
          <p className="text-xs font-semibold text-dark/75 mb-2">
            Dostęp do modułów
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MODULES.map((module) => {
              const checked = moduleFlags[module];
              return (
                <label
                  key={module}
                  className={`flex items-center gap-2 p-2 border rounded-lg text-xs cursor-pointer transition-colors ${
                    checked
                      ? 'border-darkGreen'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(event) =>
                      setValue(
                        'modules',
                        applyModuleDependencies(
                          moduleFlags,
                          module,
                          event.target.checked,
                        ),
                      )
                    }
                  />
                  {checked ? (
                    <IoCheckbox className="w-6 h-6 text-darkGreen shrink-0" />
                  ) : (
                    <IoSquareOutline className="w-6 h-6 text-gray-300 shrink-0" />
                  )}
                  <span className="text-dark">{MODULE_LABELS[module]}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-200" />

        <div>
          <label className={FIELD_LABEL_CLASSES}>Hasło</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={password}
                className={`${INPUT_CLASSES} pr-9 bg-gray-50`}
              />
              <SlLock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/40 pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="h-8 px-4 border border-gray-300 rounded-lg text-darkGreen text-xs font-medium hover:bg-gray-50 transition-colors whitespace-nowrap"
              title="Generate password"
            >
              Generuj
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Użytkownik zmieni je przy pierwszym logowaniu.
          </p>
        </div>

        <div className="border-t border-gray-200 flex gap-3 justify-end pt-4">
          <Button
            variant="outline"
            size="small"
            onClick={onClose}
            type="button"
          >
            Anuluj
          </Button>
          <Button
            variant="primary"
            size="small"
            type="submit"
            isPending={createUserMutation.isPending}
            className="font-medium!"
          >
            Utwórz konto
          </Button>
        </div>
      </form>
    </Modal>
  );
}
