import { Controller, useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { FieldError } from '../../../components/ui/FieldError';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../components/ui/formStyles';
import { usePartners } from '../../partners/hooks/usePartners';

const FOUNDATION = 'FOUNDATION';

interface CategoryFormValues {
  name: string;
  realizer: string;
}

interface CategoryFormModalProps {
  initial: { name: string; partnerId: string | null } | null;
  partnerOnly?: boolean;
  onClose: () => void;
  onSave: (values: { name: string; partnerId: string | null }) => void;
}

export function CategoryFormModal({
  initial,
  partnerOnly = false,
  onClose,
  onSave,
}: CategoryFormModalProps) {
  const partnersQuery = usePartners();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    defaultValues: {
      name: initial?.name ?? '',
      realizer: initial?.partnerId ?? (partnerOnly ? '' : FOUNDATION),
    },
  });
  const realizerOptions = [
    ...(partnerOnly ? [] : [{ value: FOUNDATION, label: 'Fundacja' }]),
    ...(partnersQuery.data ?? [])
      .filter(
        (partner) =>
          partner.status === 'ACTIVE' || partner.id === initial?.partnerId,
      )
      .map((partner) => ({ value: partner.id, label: partner.name })),
  ];

  const submit = handleSubmit(({ name, realizer }) => {
    onSave({
      name: name.trim(),
      partnerId: realizer === FOUNDATION ? null : realizer,
    });
    onClose();
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        partnerOnly
          ? 'Udostępnij partnerowi'
          : initial
            ? 'Edytuj kategorię'
            : 'Nowa kategoria'
      }
    >
      <form onSubmit={submit} className="space-y-5">
        {!partnerOnly && (
          <div>
            <label className={FIELD_LABEL_CLASSES}>Nazwa kategorii</label>
            <input
              type="text"
              autoFocus
              className={INPUT_CLASSES}
              {...register('name', {
                validate: (value) =>
                  value.trim() !== '' || 'Podaj nazwę kategorii',
              })}
            />
            <FieldError message={errors.name?.message} />
          </div>
        )}
        <div>
          <label className={FIELD_LABEL_CLASSES}>
            {partnerOnly ? 'Partner' : 'Kto realizuje'}
          </label>
          <Controller
            control={control}
            name="realizer"
            rules={{
              validate: (value) => value !== '' || 'Wybierz partnera',
            }}
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={realizerOptions}
                placeholder={
                  partnerOnly ? 'Wybierz partnera' : 'Wybierz realizującego'
                }
                size="md"
                allowEmpty={false}
              />
            )}
          />
          <FieldError message={errors.realizer?.message} />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button
            type="button"
            variant="outline"
            size="small"
            onClick={onClose}
          >
            Anuluj
          </Button>
          <Button type="submit" variant="primary" size="small">
            {partnerOnly ? 'Udostępnij' : 'Zapisz'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
