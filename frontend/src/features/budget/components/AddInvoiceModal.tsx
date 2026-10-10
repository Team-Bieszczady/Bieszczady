import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import { DateInput } from '../../../components/ui/DateInput';
import { FieldError } from '../../../components/ui/FieldError';
import { Modal } from '../../../components/ui/Modal';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../components/ui/formStyles';
import { useAuth } from '../../../context/useAuth';
import type { DocumentLink, Invoice } from '../types';
import { parseMoney } from '../utils/budgetTotals';
import { DocumentLinkPicker } from './DocumentLinkPicker';

interface AddInvoiceFormValues {
  number: string;
  contractor: string;
  date: string;
  amount: string;
  grant: string;
  ownContribution: string;
  document: DocumentLink | null;
}

interface AddInvoiceModalProps {
  projectId: string;
  positionName: string;
  folderPaths: Map<string, string> | null;
  onClose: () => void;
  onAdd: (invoice: Invoice) => void;
}

const moneyRules = (required: boolean) => ({
  validate: (value: string) =>
    (!required && value.trim() === '') ||
    parseMoney(value) !== null ||
    'Wpisz kwotę, np. 1500 lub 1500,50',
});

export function AddInvoiceModal({
  projectId,
  positionName,
  folderPaths,
  onClose,
  onAdd,
}: AddInvoiceModalProps) {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AddInvoiceFormValues>({
    defaultValues: {
      number: '',
      contractor: '',
      date: '',
      amount: '',
      grant: '',
      ownContribution: '',
      document: null,
    },
  });

  const onSubmit = (values: AddInvoiceFormValues) => {
    onAdd({
      id: crypto.randomUUID(),
      number: values.number.trim(),
      amount: parseMoney(values.amount) ?? 0,
      contractor: values.contractor.trim(),
      date: values.date,
      grant: parseMoney(values.grant) ?? 0,
      ownContribution: parseMoney(values.ownContribution) ?? 0,
      enteredBy: user ? `${user.firstName} ${user.lastName}` : '',
      status: 'TO_BE_PAID',
      document: values.document,
    });
    toast.success('Faktura dodana');
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={`Dodaj fakturę: ${positionName}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={FIELD_LABEL_CLASSES}>Nr dokumentu</label>
            <input
              type="text"
              placeholder="np. FV/2026/04/017"
              className={INPUT_CLASSES}
              {...register('number', {
                validate: (value) =>
                  value.trim() !== '' || 'Podaj numer dokumentu',
              })}
            />
            <FieldError message={errors.number?.message} />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES}>Kontrahent</label>
            <input
              type="text"
              placeholder="Podaj.."
              className={INPUT_CLASSES}
              {...register('contractor', {
                validate: (value) => value.trim() !== '' || 'Podaj kontrahenta',
              })}
            />
            <FieldError message={errors.contractor?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={FIELD_LABEL_CLASSES}>Data</label>
            <Controller
              control={control}
              name="date"
              rules={{ required: 'Podaj datę' }}
              render={({ field }) => (
                <DateInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.date}
                />
              )}
            />
            <FieldError message={errors.date?.message} />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES}>Poniesione</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              className={`${INPUT_CLASSES} tabular-nums`}
              {...register('amount', moneyRules(true))}
            />
            <FieldError message={errors.amount?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={FIELD_LABEL_CLASSES}>
              Dotacja{' '}
              <span className="font-normal text-gray-400">opcjonalnie</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              className={`${INPUT_CLASSES} tabular-nums`}
              {...register('grant', moneyRules(false))}
            />
            <FieldError message={errors.grant?.message} />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES}>
              Wkład własny{' '}
              <span className="font-normal text-gray-400">opcjonalnie</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              className={`${INPUT_CLASSES} tabular-nums`}
              {...register('ownContribution', {
                validate: (value, values) => {
                  const base = moneyRules(false).validate(value);
                  if (base !== true) return base;

                  const split =
                    (parseMoney(values.grant) ?? 0) + (parseMoney(value) ?? 0);
                  return (
                    split <= (parseMoney(values.amount) ?? 0) ||
                    'Dotacja i wkład własny przekraczają kwotę faktury'
                  );
                },
              })}
            />
            <FieldError message={errors.ownContribution?.message} />
          </div>
        </div>

        <div>
          <p className={FIELD_LABEL_CLASSES}>
            Dokument{' '}
            <span className="font-normal text-gray-400">opcjonalnie</span>
          </p>
          <Controller
            control={control}
            name="document"
            render={({ field }) => (
              <DocumentLinkPicker
                projectId={projectId}
                folderPaths={folderPaths}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
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
          <Button
            type="submit"
            variant="primary"
            size="small"
            disabled={isSubmitting}
          >
            Dodaj fakturę
          </Button>
        </div>
      </form>
    </Modal>
  );
}
