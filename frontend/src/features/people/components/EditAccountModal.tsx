import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { Avatar } from '../../../components/ui/Avatar';
import { useUpdateSelf } from '../hooks/useUpdateSelf';
import { resizeImageToDataUrl } from '../utils/resizeImageToDataUrl';
import { toastAccountError } from '../utils/accountErrorMessage';
import { NAME_MAX_LENGTH, nameRules } from '../../../lib/nameValidation';
import type { Person } from '../data';
import {
  FIELD_ERROR_CLASSES,
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../components/ui/formStyles';

interface EditAccountModalProps {
  person: Person;
  isOpen: boolean;
  onClose: () => void;
}

interface EditAccountFormInputs {
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string | null;
}

export default function EditAccountModal({
  person,
  isOpen,
  onClose,
}: EditAccountModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const updateSelf = useUpdateSelf();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    control,
  } = useForm<EditAccountFormInputs>({
    mode: 'onChange',
    defaultValues: {
      firstName: person.firstName,
      lastName: person.lastName,
      phone: person.phone,
      avatar: person.avatar,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        firstName: person.firstName,
        lastName: person.lastName,
        phone: person.phone,
        avatar: person.avatar,
      });
    }
  }, [isOpen, person, reset]);

  const avatarValue = useWatch({ control, name: 'avatar' });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setValue('avatar', dataUrl, { shouldDirty: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Nie udało się wczytać zdjęcia.',
      );
    } finally {
      setIsProcessingImage(false);
    }
  };

  const onSubmit = (data: EditAccountFormInputs) => {
    const payload = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone.trim(),
      ...(data.avatar !== person.avatar ? { avatar: data.avatar ?? '' } : {}),
    };

    updateSelf.mutate(payload, {
      onSuccess: () => {
        toast.success('Zmiany zostały zapisane.');
        onClose();
      },
      onError: toastAccountError,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edytuj konto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <input type="hidden" {...register('avatar')} />

        <div className="flex items-center gap-4">
          <Avatar initials={person.initials} src={avatarValue} size="lg" />
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="small"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingImage}
            >
              {isProcessingImage ? <Spinner size="16" /> : 'Zmień zdjęcie'}
            </Button>
            {avatarValue && (
              <button
                type="button"
                onClick={() =>
                  setValue('avatar', null, { shouldDirty: true })
                }
                className="text-xs font-medium text-darkRed hover:underline"
              >
                Usuń zdjęcie
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={FIELD_LABEL_CLASSES}>
              Imię
            </label>
            <input
              type="text"
              maxLength={NAME_MAX_LENGTH}
              className={INPUT_CLASSES}
              {...register('firstName', nameRules('Imię'))}
            />
            {errors.firstName && (
              <p className={FIELD_ERROR_CLASSES}>
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES}>
              Nazwisko
            </label>
            <input
              type="text"
              maxLength={NAME_MAX_LENGTH}
              className={INPUT_CLASSES}
              {...register('lastName', nameRules('Nazwisko'))}
            />
            {errors.lastName && (
              <p className={FIELD_ERROR_CLASSES}>
                {errors.lastName.message}
              </p>
            )}
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
            <label className={FIELD_LABEL_CLASSES}>
              E-mail
            </label>
            <input
              type="email"
              readOnly
              disabled
              value={person.email}
              className={`${INPUT_CLASSES} bg-gray-50`}
            />
            <p className="mt-1 text-xs text-gray-400">
              Adres e-mail nie może zostać zmieniony
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            size="small"
            onClick={onClose}
            disabled={updateSelf.isPending}
          >
            Anuluj
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="small"
            disabled={isProcessingImage}
            isPending={updateSelf.isPending}
          >
            Zapisz zmiany
          </Button>
        </div>
      </form>
    </Modal>
  );
}
