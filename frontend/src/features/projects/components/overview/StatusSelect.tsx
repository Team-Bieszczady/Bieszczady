import { useState } from 'react';
import { FieldError } from '../../../../components/ui/FieldError';
import { useForm, useWatch } from 'react-hook-form';
import { SlArrowDown } from 'react-icons/sl';
import { IoCheckmark } from 'react-icons/io5';
import { HiOutlinePlus } from 'react-icons/hi';
import { FiSettings } from 'react-icons/fi';
import { useAnchoredPopup } from '../../../../hooks/useAnchoredPopup';
import { PopoverPanel } from '../../../../components/ui/PopoverPanel';
import { SwatchPicker } from '../../../../components/ui/SwatchPicker';
import { Button } from '../../../../components/ui/Button';
import {
  STATUS_COLORS,
  getStatusColor,
  type StatusColorId,
} from '../../overviewStatuses';
import type { DictionaryEntry } from '../../../../lib/projectsApi';
import type { CreateStatusResult } from '../../hooks/useProjectOverviewEditing';

interface NewStatusFormValues {
  name: string;
  color: StatusColorId;
}

interface NewStatusFormProps {
  onCreate: (name: string, color: StatusColorId) => Promise<CreateStatusResult>;
  onCancel: () => void;
}

function NewStatusForm({ onCreate, onCancel }: NewStatusFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<NewStatusFormValues>({
    defaultValues: { name: '', color: STATUS_COLORS[0].id },
  });

  const color = useWatch({ control, name: 'color' });

  const submit = handleSubmit(async ({ name, color: picked }) => {
    const result = await onCreate(name.trim(), picked);
    if (result.reason === 'duplicate') {
      setError('name', { message: 'Taki status już istnieje' });
    }
  });

  return (
    <form onSubmit={submit} className="p-2">
      <input
        {...register('name', {
          validate: (value) =>
            value.trim().length > 0 || 'Nazwa nie może być pusta',
        })}
        autoFocus
        type="text"
        placeholder="Nazwa statusu"
        aria-label="Nazwa nowego statusu"
        className="h-8 w-full rounded-md border border-gray-200 px-2 text-xs focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none"
      />
      <FieldError message={errors.name?.message} />

      <SwatchPicker
        colors={STATUS_COLORS}
        value={color}
        onChange={(next) => setValue('color', next as StatusColorId)}
        ariaLabel="Kolor statusu"
        className="mt-3"
      />

      <div className="mt-3 flex gap-2">
        <Button
          variant="primary"
          size="small"
          type="submit"
          isPending={isSubmitting}
          disabled={isSubmitting}
          className="font-medium!"
        >
          Dodaj
        </Button>
        <Button variant="outline" size="small" type="button" onClick={onCancel}>
          Anuluj
        </Button>
      </div>
    </form>
  );
}

interface StatusSelectProps {
  status: { id: string; name: string; color: string } | null;
  statuses: ReadonlyArray<DictionaryEntry>;
  canEdit: boolean;
  onSelect: (id: string) => void;
  onCreateStatus: (
    name: string,
    color: StatusColorId,
  ) => Promise<CreateStatusResult>;
  onManage: () => void;
}

export default function StatusSelect({
  status,
  statuses,
  canEdit,
  onSelect,
  onCreateStatus,
  onManage,
}: StatusSelectProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { isOpen, close, toggle, buttonRef, panelRef, position } =
    useAnchoredPopup<HTMLButtonElement, HTMLDivElement>({
      offset: 4,
      viewportMargin: 8,
      flip: true,
      preferredHeight: 320,
      restoreFocus: true,
    });

  const pill = status
    ? getStatusColor(status.color).pill
    : 'bg-gray-200 text-grayText';
  const label = status?.name ?? 'Brak statusu';

  const selectable = statuses.filter(
    (entry) => entry.active || entry.id === status?.id,
  );

  const dismiss = () => {
    setIsCreating(false);
    close();
  };

  const choose = (id: string) => {
    onSelect(id);
    dismiss();
    buttonRef.current?.focus();
  };

  if (!canEdit) {
    return (
      <span
        className={`inline-flex h-8 items-center rounded-lg px-3.5 text-xs font-semibold ${pill}`}
      >
        {label}
      </span>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={toggle}
        className={`inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg px-3.5 text-xs font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darkGreen focus-visible:ring-offset-2 ${pill}`}
      >
        {label}
        <SlArrowDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <PopoverPanel
          panelRef={panelRef}
          position={position}
          align="right"
          minWidth={240}
          centerOnMobile
          role="listbox"
          ariaLabel="Status projektu"
        >
          {selectable.map((entry) => {
            const isSelected = entry.id === status?.id;

            return (
              <button
                key={entry.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => choose(entry.id)}
                className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-md p-2 text-left text-xs transition-colors hover:bg-gray-50 ${
                  isSelected ? 'font-medium text-darkGreen' : 'text-dark'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      getStatusColor(entry.color ?? '').dot
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{entry.name}</span>
                </span>
                {isSelected && (
                  <IoCheckmark
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}

          <div className="mt-1 border-t border-gray-100 pt-1">
            {isCreating ? (
              <NewStatusForm
                onCreate={async (name, color) => {
                  const result = await onCreateStatus(name, color);
                  if (result.ok) dismiss();
                  return result;
                }}
                onCancel={() => setIsCreating(false)}
              />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="flex w-full cursor-pointer items-center gap-1.5 rounded-md p-2 text-left text-xs font-medium text-darkGreen transition-colors hover:bg-gray-50"
                >
                  <HiOutlinePlus
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  Nowy status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dismiss();
                    onManage();
                  }}
                  className="flex w-full cursor-pointer items-center gap-1.5 rounded-md p-2 text-left text-xs text-grayText transition-colors hover:bg-gray-50 hover:text-dark"
                >
                  <FiSettings
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  Zarządzaj statusami
                </button>
              </>
            )}
          </div>
        </PopoverPanel>
      )}
    </>
  );
}
