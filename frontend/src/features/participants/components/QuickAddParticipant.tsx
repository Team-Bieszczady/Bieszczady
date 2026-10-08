import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { FieldError } from '../../../components/ui/FieldError';
import { INPUT_CLASSES } from '../../../components/ui/formStyles';
import type { ParticipantChanges } from '../../../lib/api';
import { NAME_MAX_LENGTH, nameRules } from '../../../lib/nameValidation';
import { emailOrEmpty } from '../validation';

interface QuickAddInputs {
  firstName: string;
  lastName: string;
  email: string;
  hasConsent: boolean;
}

interface QuickAddParticipantProps {
  searchedName: string;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (participant: ParticipantChanges) => void;
}

function splitName(text: string) {
  const words = text.split(' ').filter((word) => word !== '');

  return {
    firstName: words[0] || '',
    lastName: words.slice(1).join(' '),
  };
}

export function QuickAddParticipant({
  searchedName,
  isPending,
  onCancel,
  onSubmit,
}: QuickAddParticipantProps) {
  const name = splitName(searchedName);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuickAddInputs>({
    defaultValues: {
      firstName: name.firstName,
      lastName: name.lastName,
      email: '',
      hasConsent: false,
    },
  });

  const submit = (values: QuickAddInputs) => {
    onSubmit({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: '',
      address: '',
      note: '',
      hasConsent: values.hasConsent,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
    >
      <p className="text-xs font-semibold text-dark">
        Nowa osoba w bazie uczestników
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <input
            {...register('firstName', nameRules('Imię'))}
            type="text"
            autoFocus
            maxLength={NAME_MAX_LENGTH}
            placeholder="Imię"
            aria-label="Imię"
            aria-invalid={!!errors.firstName}
            className={INPUT_CLASSES}
          />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div>
          <input
            {...register('lastName', nameRules('Nazwisko'))}
            type="text"
            maxLength={NAME_MAX_LENGTH}
            placeholder="Nazwisko"
            aria-label="Nazwisko"
            aria-invalid={!!errors.lastName}
            className={INPUT_CLASSES}
          />
          <FieldError message={errors.lastName?.message} />
        </div>
      </div>

      <div>
        <input
          {...register('email', { validate: emailOrEmpty })}
          type="email"
          placeholder="E-mail (nieobowiązkowo)"
          aria-label="E-mail"
          aria-invalid={!!errors.email}
          className={INPUT_CLASSES}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-dark">
        <input
          {...register('hasConsent')}
          type="checkbox"
          className="h-4 w-4 cursor-pointer accent-darkGreen"
        />
        Zgoda na kontakt (newsletter, zaproszenia)
      </label>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="small"
          type="button"
          onClick={onCancel}
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
          {isPending ? 'Zapisywanie…' : 'Dodaj i dopisz'}
        </Button>
      </div>
    </form>
  );
}
