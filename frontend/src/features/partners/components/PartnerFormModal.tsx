import { Controller, useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { IoCheckbox, IoSquareOutline } from 'react-icons/io5';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { DateInput } from '../../../components/ui/DateInput';
import { FieldError } from '../../../components/ui/FieldError';
import { RadioPillGroup } from '../../../components/ui/RadioPillGroup';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../components/ui/formStyles';
import { useProjects } from '../../projects/hooks/useProjectsApi';
import { useSavePartner } from '../hooks/usePartners';
import {
  AGREEMENT_OPTIONS,
  NO_AGREEMENT,
  PARTNER_STATUS_OPTIONS,
  PARTNER_TYPE_OPTIONS,
} from '../constants';
import type { Partner, PartnerStatus } from '../data';

interface PartnerFormModalProps {
  partner?: Partner;
  onClose: () => void;
}

interface PartnerFormInputs {
  name: string;
  type: string;
  nip: string;
  city: string;
  email: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  projectIds: string[];
  agreement: string;
  agreementValidUntil: string;
  status: PartnerStatus;
}

const EMAIL_PATTERN = {
  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  message: 'Podaj poprawny adres e-mail',
};

export default function PartnerFormModal({
  partner,
  onClose,
}: PartnerFormModalProps) {
  const isEditing = !!partner;
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PartnerFormInputs>({
    mode: 'onChange',
    defaultValues: {
      name: partner?.name ?? '',
      type: partner?.type ?? '',
      nip: partner?.nip ?? '',
      city: partner?.city ?? '',
      email: partner?.email ?? '',
      contactName: partner?.contactName ?? '',
      contactEmail: partner?.contactEmail ?? '',
      contactPhone: partner?.contactPhone ?? '',
      projectIds: partner?.projects.map((project) => project.id) ?? [],
      agreement: partner?.agreement ?? '',
      agreementValidUntil: partner?.agreementValidUntil ?? '',
      status: partner?.status ?? 'ACTIVE',
    },
  });

  const savePartner = useSavePartner();
  const projects = useProjects();
  const status = useWatch({ control, name: 'status' });
  const agreement = useWatch({ control, name: 'agreement' });

  const projectOptions = [
    ...(projects.data ?? []).map(({ id, name }) => ({ id, name })),
    ...(partner?.projects ?? []).filter(
      (project) => !projects.data?.some(({ id }) => id === project.id),
    ),
  ];

  const onSubmit = ({ projectIds, ...data }: PartnerFormInputs) => {
    savePartner.mutate(
      {
        id: partner?.id,
        input: {
          ...data,
          agreementValidUntil:
            data.agreement === NO_AGREEMENT ? '' : data.agreementValidUntil,
          projects: projectOptions.filter((project) =>
            projectIds.includes(project.id),
          ),
        },
      },
      {
        onSuccess: () => {
          toast.success(
            isEditing ? 'Zapisano zmiany partnera' : 'Dodano partnera',
          );
          onClose();
        },
        onError: () => {
          toast.error('Coś poszło nie tak', { id: 'partner-save-error' });
        },
      },
    );
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEditing ? 'Edytuj partnera' : 'Dodaj partnera'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className={FIELD_LABEL_CLASSES}>Nazwa organizacji</label>
          <input
            type="text"
            placeholder="np. Fundacja Bieszczadzka"
            className={INPUT_CLASSES}
            {...register('name', {
              required: 'Nazwa jest wymagana',
              validate: (value) => !!value.trim() || 'Nazwa jest wymagana',
            })}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={FIELD_LABEL_CLASSES}>Typ</label>
            <Controller
              name="type"
              control={control}
              rules={{ required: 'Wybierz typ organizacji' }}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Wybierz"
                  options={PARTNER_TYPE_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.type}
                />
              )}
            />
            <FieldError message={errors.type?.message} />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES}>
              NIP <span className="font-normal text-gray-400">opcjonalnie</span>
            </label>
            <input
              type="text"
              placeholder="000-00-00-000"
              className={INPUT_CLASSES}
              {...register('nip', {
                validate: (value) =>
                  !value ||
                  value.replace(/\D/g, '').length === 10 ||
                  'NIP musi mieć 10 cyfr',
              })}
            />
            <FieldError message={errors.nip?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={FIELD_LABEL_CLASSES}>
              Miejscowość{' '}
              <span className="font-normal text-gray-400">opcjonalnie</span>
            </label>
            <input
              type="text"
              placeholder="np. Ustrzyki Dolne"
              className={INPUT_CLASSES}
              {...register('city')}
            />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES}>
              E-mail organizacji{' '}
              <span className="font-normal text-gray-400">opcjonalnie</span>
            </label>
            <input
              type="email"
              placeholder="biuro@organizacja.pl"
              className={INPUT_CLASSES}
              {...register('email', { pattern: EMAIL_PATTERN })}
            />
            <FieldError message={errors.email?.message} />
          </div>
        </div>

        <div className="border-t border-gray-200" />

        <p className="text-xs font-semibold text-dark/75">Osoba kontaktowa</p>

        <div>
          <label className={FIELD_LABEL_CLASSES}>Imię i nazwisko</label>
          <input
            type="text"
            placeholder="Podaj.."
            className={INPUT_CLASSES}
            {...register('contactName', {
              required: 'Osoba kontaktowa jest wymagana',
              validate: (value) =>
                !!value.trim() || 'Osoba kontaktowa jest wymagana',
            })}
          />
          <FieldError message={errors.contactName?.message} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={FIELD_LABEL_CLASSES}>E-mail</label>
            <input
              type="email"
              placeholder="jan.kowalski@organizacja.pl"
              className={INPUT_CLASSES}
              {...register('contactEmail', {
                required: 'E-mail jest wymagany',
                pattern: EMAIL_PATTERN,
              })}
            />
            <FieldError message={errors.contactEmail?.message} />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES}>
              Telefon{' '}
              <span className="font-normal text-gray-400">opcjonalnie</span>
            </label>
            <input
              type="tel"
              placeholder="+48 000 000 000"
              className={INPUT_CLASSES}
              {...register('contactPhone')}
            />
          </div>
        </div>

        <div className="border-t border-gray-200" />

        <div>
          <p className="text-xs font-semibold text-dark/75 mb-2">Projekty</p>
          <Controller
            name="projectIds"
            control={control}
            render={({ field }) =>
              projectOptions.length === 0 ? (
                <p className="text-xs text-gray-400">
                  {projects.isLoading ? 'Ładowanie...' : 'Brak projektów'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {projectOptions.map((project) => {
                    const checked = field.value.includes(project.id);
                    return (
                      <label
                        key={project.id}
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
                            field.onChange(
                              event.target.checked
                                ? [...field.value, project.id]
                                : field.value.filter((id) => id !== project.id),
                            )
                          }
                        />
                        {checked ? (
                          <IoCheckbox className="w-6 h-6 text-darkGreen shrink-0" />
                        ) : (
                          <IoSquareOutline className="w-6 h-6 text-gray-300 shrink-0" />
                        )}
                        <span className="text-dark truncate">
                          {project.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )
            }
          />
        </div>

        <div className="border-t border-gray-200" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={FIELD_LABEL_CLASSES}>Umowa</label>
            <Controller
              name="agreement"
              control={control}
              rules={{ required: 'Wybierz rodzaj umowy' }}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Wybierz"
                  options={AGREEMENT_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.agreement}
                />
              )}
            />
            <FieldError message={errors.agreement?.message} />
          </div>
          {agreement !== NO_AGREEMENT && (
            <div>
              <label className={FIELD_LABEL_CLASSES}>
                Ważna do{' '}
                <span className="font-normal text-gray-400">
                  puste = bezterminowo
                </span>
              </label>
              <Controller
                name="agreementValidUntil"
                control={control}
                render={({ field }) => (
                  <DateInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
          )}
        </div>

        <RadioPillGroup
          legend="Status"
          options={PARTNER_STATUS_OPTIONS}
          value={status}
          registration={register('status')}
        />

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
            isPending={savePartner.isPending}
            className="font-medium!"
          >
            {isEditing ? 'Zapisz zmiany' : 'Dodaj partnera'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
