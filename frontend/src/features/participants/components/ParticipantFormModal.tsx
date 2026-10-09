import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { LuTrash2 } from 'react-icons/lu';
import { Button } from '../../../components/ui/Button';
import { FieldError } from '../../../components/ui/FieldError';
import { Modal } from '../../../components/ui/Modal';
import { INPUT_CLASSES } from '../../../components/ui/formStyles';
import type { BackendParticipant, ParticipantChanges } from '../../../lib/api';
import { NAME_MAX_LENGTH, nameRules } from '../../../lib/nameValidation';
import { emailOrEmpty, PHONE_PATTERN } from '../validation';
import { ParticipantHistorySection } from './ParticipantHistorySection';

interface ParticipantFormModalProps {
  participant?: BackendParticipant;
  onClose: () => void;
  onSubmit: (values: ParticipantChanges) => void;
  onDelete?: () => void;
  isPending: boolean;
}

const LABEL_CLASSES = 'mb-2 block text-sm text-dark/80';
const TEXTAREA_CLASSES =
  'w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-xs leading-relaxed text-dark focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none';

function startingValues(
  participant: BackendParticipant | undefined,
): ParticipantChanges {
  if (!participant) {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      note: '',
      hasConsent: false,
    };
  }

  return {
    firstName: participant.firstName,
    lastName: participant.lastName,
    email: participant.email || '',
    phone: participant.phone || '',
    address: participant.address || '',
    note: participant.note,
    hasConsent: participant.consentAt !== null,
  };
}

export default function ParticipantFormModal({
  participant,
  onClose,
  onSubmit,
  onDelete,
  isPending,
}: ParticipantFormModalProps) {
  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const addressId = useId();
  const noteId = useId();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ParticipantChanges>({
    defaultValues: startingValues(participant),
  });

  let consentNote = '';
  if (participant && participant.consentAt) {
    const consentDay = new Date(participant.consentAt).toLocaleDateString(
      'pl-PL',
    );
    consentNote = `Zgoda zapisana ${consentDay}.`;
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={participant ? 'Edytuj uczestnika' : 'Dodaj uczestnika'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLASSES} htmlFor={firstNameId}>
              Imię
            </label>
            <input
              {...register('firstName', nameRules('Imię'))}
              id={firstNameId}
              type="text"
              autoFocus
              maxLength={NAME_MAX_LENGTH}
              placeholder="np. Anna"
              aria-invalid={!!errors.firstName}
              className={INPUT_CLASSES}
            />
            <FieldError message={errors.firstName?.message} />
          </div>

          <div>
            <label className={LABEL_CLASSES} htmlFor={lastNameId}>
              Nazwisko
            </label>
            <input
              {...register('lastName', nameRules('Nazwisko'))}
              id={lastNameId}
              type="text"
              maxLength={NAME_MAX_LENGTH}
              placeholder="np. Kowalska"
              aria-invalid={!!errors.lastName}
              className={INPUT_CLASSES}
            />
            <FieldError message={errors.lastName?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLASSES} htmlFor={emailId}>
              E-mail
            </label>
            <input
              {...register('email', {
                validate: emailOrEmpty,
              })}
              id={emailId}
              type="email"
              placeholder="np. anna@poczta.pl"
              aria-invalid={!!errors.email}
              className={INPUT_CLASSES}
            />
            <FieldError message={errors.email?.message} />
          </div>

          <div>
            <label className={LABEL_CLASSES} htmlFor={phoneId}>
              Telefon
            </label>
            <input
              {...register('phone', {
                maxLength: {
                  value: 20,
                  message: 'Telefon może mieć maksymalnie 20 znaków',
                },
                validate: (value) =>
                  PHONE_PATTERN.test(value) ||
                  'Tylko cyfry, spacje, +, - i nawiasy',
              })}
              id={phoneId}
              type="tel"
              placeholder="np. 600 100 200"
              aria-invalid={!!errors.phone}
              className={INPUT_CLASSES}
            />
            <FieldError message={errors.phone?.message} />
          </div>
        </div>

        <div>
          <label className={LABEL_CLASSES} htmlFor={addressId}>
            Adres
          </label>
          <input
            {...register('address', {
              maxLength: {
                value: 500,
                message: 'Adres może mieć maksymalnie 500 znaków',
              },
            })}
            id={addressId}
            type="text"
            placeholder="np. Lesko, ul. Bieszczadzka 1"
            aria-invalid={!!errors.address}
            className={INPUT_CLASSES}
          />
          <FieldError message={errors.address?.message} />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50">
          <input
            {...register('hasConsent')}
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-darkGreen"
          />
          <span>
            <span className="block text-sm font-medium text-dark">
              Zgoda na kontakt
            </span>
            <span className="mt-0.5 block text-xs text-grayText">
              Osoba zgodziła się na newsletter i zaproszenia na wydarzenia, np.
              podpisując zgodę na liście obecności.
            </span>
            {consentNote && (
              <span className="mt-1 block text-xs text-darkGreen">
                {consentNote}
              </span>
            )}
          </span>
        </label>

        <div>
          <label className={LABEL_CLASSES} htmlFor={noteId}>
            Notatka
          </label>
          <textarea
            {...register('note', {
              maxLength: {
                value: 2000,
                message: 'Notatka może mieć maksymalnie 2000 znaków',
              },
            })}
            id={noteId}
            rows={2}
            placeholder="np. przyszła z wnuczką, interesują ją warsztaty ceramiczne"
            aria-invalid={!!errors.note}
            className={TEXTAREA_CLASSES}
          />
          <FieldError message={errors.note?.message} />
        </div>

        {participant && (
          <div className="border-t border-gray-200 pt-4">
            <ParticipantHistorySection participantId={participant.id} />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
          <div>
            {onDelete && (
              <Button
                variant="outline"
                size="small"
                type="button"
                onClick={onDelete}
                disabled={isPending}
                className="gap-1.5 border-darkRed text-darkRed hover:bg-red-50"
              >
                <LuTrash2 size={14} aria-hidden="true" />
                Usuń
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="small"
              type="button"
              onClick={onClose}
              disabled={isPending}
            >
              Anuluj
            </Button>
            <Button
              variant="primary"
              size="small"
              type="submit"
              disabled={isPending}
              className="font-medium!"
            >
              {isPending ? 'Zapisywanie…' : 'Zapisz'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
