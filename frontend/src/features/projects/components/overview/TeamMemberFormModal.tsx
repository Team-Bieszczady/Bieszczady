import { Controller, useForm } from 'react-hook-form';
import { FieldError } from '../../../../components/ui/FieldError';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { Select, type SelectOption } from '../../../../components/ui/Select';
import { FIELD_LABEL_CLASSES } from '../../../../components/ui/formStyles';
import type { ProjectRoleValue } from '../../../../lib/projectsApi';
import { PROJECT_ROLE_OPTIONS } from '../../labels';
import type { TeamMemberView } from '../../hooks/useProjectTeam';

interface TeamMemberFormInputs {
  userId: string;
  role: ProjectRoleValue;
}

interface TeamMemberFormModalProps {
  mode: 'add' | 'role';
  member: TeamMemberView | null;
  candidateOptions: SelectOption[];
  onClose: () => void;
  onSubmit: (values: TeamMemberFormInputs) => void | Promise<unknown>;
}

export default function TeamMemberFormModal({
  mode,
  member,
  candidateOptions,
  onClose,
  onSubmit,
}: TeamMemberFormModalProps) {
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TeamMemberFormInputs>({
    defaultValues: {
      userId: member?.userId ?? '',
      role: member?.role ?? 'EXECUTOR',
    },
  });

  const isAdding = mode === 'add';

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isAdding ? 'Dodaj członka zespołu' : 'Zmień rolę w projekcie'}
    >
      <form
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values);
        })}
        className="space-y-5"
      >
        {isAdding ? (
          <div>
            <label className={FIELD_LABEL_CLASSES}>Osoba</label>
            <Controller
              name="userId"
              control={control}
              rules={{ validate: (value) => !!value || 'Wybierz osobę' }}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Wybierz osobę"
                  options={candidateOptions}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.userId}
                />
              )}
            />
            <FieldError message={errors.userId?.message} />
            {candidateOptions.length === 0 && (
              <p className="mt-1 text-[11px] text-mutedText">
                Wszyscy dostępni są już w tym projekcie.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
            <p className="text-[10px] font-semibold tracking-[0.5px] text-mutedText">
              OSOBA
            </p>
            <p className="mt-1 text-sm font-bold text-dark">{member?.name}</p>
          </div>
        )}

        <div>
          <label className={FIELD_LABEL_CLASSES}>Rola w projekcie</label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                size="md"
                placeholder="Wybierz rolę"
                options={PROJECT_ROLE_OPTIONS}
                value={field.value}
                onChange={(value) => field.onChange(value as ProjectRoleValue)}
                onBlur={field.onBlur}
              />
            )}
          />
          <p className="mt-1 text-[11px] text-mutedText">
            Rola obowiązuje tylko w tym projekcie — ta sama osoba może mieć inną
            w innym.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button
            variant="outline"
            size="small"
            type="button"
            onClick={onClose}
          >
            Anuluj
          </Button>
          <Button
            variant="primary"
            size="small"
            type="submit"
            isPending={isSubmitting}
            disabled={isSubmitting}
            className="font-medium!"
          >
            Zapisz
          </Button>
        </div>
      </form>
    </Modal>
  );
}
