import { useId } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
import { Button } from '../../../components/ui/Button';
import { DateInput } from '../../../components/ui/DateInput';
import { FieldError } from '../../../components/ui/FieldError';
import { Modal } from '../../../components/ui/Modal';
import { Select, type SelectOption } from '../../../components/ui/Select';
import { INPUT_CLASSES } from '../../../components/ui/formStyles';
import type { BackendInvoice } from '../../../lib/api';
import { todayIso } from '../../projects/utils/isoDate';

export interface InvoiceFormInputs {
  name: string;
  amount: string;
  paymentDate: string;
  shares: { projectId: string; amount: string }[];
}

interface InvoiceFormModalProps {
  invoice?: BackendInvoice;
  projectOptions: SelectOption[];
  onClose: () => void;
  onSubmit: (values: InvoiceFormInputs) => void;
  isPending?: boolean;
}

const LABEL_CLASSES = 'mb-2 block text-sm text-dark/80';

function startingValues(
  invoice: BackendInvoice | undefined,
): InvoiceFormInputs {
  if (invoice) {
    return {
      name: invoice.name,
      amount: invoice.amount,
      paymentDate: invoice.paymentDate.slice(0, 10),
      shares: invoice.shares.map((share) => ({
        projectId: share.projectId,
        amount: share.amount,
      })),
    };
  }

  return {
    name: '',
    amount: '',
    paymentDate: todayIso(),
    shares: [{ projectId: '', amount: '' }],
  };
}

function sharesTotal(shares: { amount: string }[]) {
  let total = 0;
  for (const share of shares) {
    const value = Number(share.amount);
    if (Number.isFinite(value)) total += value;
  }
  return Math.round(total * 100) / 100;
}

export default function InvoiceFormModal({
  invoice,
  projectOptions,
  onClose,
  onSubmit,
  isPending = false,
}: InvoiceFormModalProps) {
  const nameId = useId();
  const amountId = useId();
  const dateId = useId();

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<InvoiceFormInputs>({
    defaultValues: startingValues(invoice),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'shares',
  });

  const amount = useWatch({ control, name: 'amount' });
  const shares = useWatch({ control, name: 'shares' });

  const submit = handleSubmit((values) => {
    const total = Number(values.amount);
    const splitTotal = sharesTotal(values.shares);

    if (Math.abs(total - splitTotal) > 0.01) {
      setError('shares', {
        message: `Suma podziału (${splitTotal.toFixed(2)} zł) musi się zgadzać z kwotą faktury (${total.toFixed(2)} zł)`,
      });
      return;
    }

    const usedProjects = new Set(values.shares.map((share) => share.projectId));
    if (usedProjects.size !== values.shares.length) {
      setError('shares', { message: 'Każdy projekt może wystąpić tylko raz' });
      return;
    }

    clearErrors('shares');
    onSubmit(values);
  });

  const splitTotal = sharesTotal(shares);
  const amountNumber = Number(amount);
  const showMismatch =
    Number.isFinite(amountNumber) &&
    amount !== '' &&
    Math.abs(amountNumber - splitTotal) > 0.01;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={invoice ? 'Edytuj fakturę' : 'Dodaj fakturę'}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <div>
          <label htmlFor={nameId} className={LABEL_CLASSES}>
            Nazwa faktury
          </label>
          <input
            id={nameId}
            {...register('name', {
              required: 'Podaj nazwę faktury',
              maxLength: { value: 200, message: 'Maksymalnie 200 znaków' },
            })}
            placeholder="np. Druk ulotek na festiwal"
            aria-invalid={!!errors.name}
            className={INPUT_CLASSES}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={amountId} className={LABEL_CLASSES}>
              Kwota
            </label>
            <div className="relative">
              <input
                id={amountId}
                type="number"
                min={0}
                step="0.01"
                {...register('amount', {
                  required: 'Podaj kwotę',
                  min: {
                    value: 0.01,
                    message: 'Kwota musi być większa od zera',
                  },
                })}
                placeholder="0"
                aria-invalid={!!errors.amount}
                className={`${INPUT_CLASSES} pr-8`}
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-dark/50">
                zł
              </span>
            </div>
            <FieldError message={errors.amount?.message} />
          </div>

          <div>
            <label htmlFor={dateId} className={LABEL_CLASSES}>
              Termin płatności
            </label>
            <Controller
              name="paymentDate"
              control={control}
              rules={{ required: 'Podaj termin płatności' }}
              render={({ field }) => (
                <DateInput
                  id={dateId}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.paymentDate}
                />
              )}
            />
            <FieldError message={errors.paymentDate?.message} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-dark/80">Podział na projekty</p>
            <button
              type="button"
              onClick={() => append({ projectId: '', amount: '' })}
              className="flex cursor-pointer items-center gap-1 text-xs font-medium text-darkGreen hover:text-darkGreenHover"
            >
              <LuPlus size={14} aria-hidden="true" />
              Dodaj projekt
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <Controller
                    name={`shares.${index}.projectId`}
                    control={control}
                    rules={{ required: 'Wybierz projekt' }}
                    render={({ field: selectField }) => (
                      <Select
                        size="md"
                        placeholder="Wybierz projekt"
                        options={projectOptions}
                        value={selectField.value}
                        onChange={selectField.onChange}
                      />
                    )}
                  />
                  <FieldError
                    message={errors.shares?.[index]?.projectId?.message}
                  />
                </div>
                <div className="w-32">
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      {...register(`shares.${index}.amount`, {
                        required: 'Podaj kwotę',
                        min: { value: 0.01, message: 'Większa od zera' },
                      })}
                      placeholder="0"
                      className={`${INPUT_CLASSES} pr-8`}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-dark/50">
                      zł
                    </span>
                  </div>
                  <FieldError
                    message={errors.shares?.[index]?.amount?.message}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                  aria-label="Usuń projekt z podziału"
                  className="mt-2 cursor-pointer text-dark/40 hover:text-darkRed disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <LuTrash2 size={16} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={showMismatch ? 'text-darkRed' : 'text-grayText'}>
              Suma podziału: {splitTotal.toFixed(2)} zł
            </span>
          </div>
          <FieldError message={errors.shares?.message} />
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
            isPending={isPending}
          >
            {invoice ? 'Zapisz' : 'Dodaj fakturę'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
