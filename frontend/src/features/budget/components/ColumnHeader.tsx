import { useForm, useWatch } from 'react-hook-form';
import { HiOutlineLockClosed, HiOutlinePlus } from 'react-icons/hi';
import { ActionMenu } from '../../../components/ui/ActionMenu';
import { Button } from '../../../components/ui/Button';
import { FieldError } from '../../../components/ui/FieldError';
import { InlineEditField } from '../../../components/ui/InlineEditField';
import { PopoverPanel } from '../../../components/ui/PopoverPanel';
import { RadioPillGroup } from '../../../components/ui/RadioPillGroup';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../components/ui/formStyles';
import { useAnchoredPopup } from '../../../hooks/useAnchoredPopup';
import { COLUMN_TYPE_OPTIONS } from '../data';
import { MENU_REVEAL_CLASSES, TH_CLASSES } from '../styles';
import type { Column, ColumnType } from '../types';

interface ColumnHeaderProps {
  column: Column;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function ColumnHeader({
  column,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onRename,
  onDelete,
}: ColumnHeaderProps) {
  if (column.locked) {
    return (
      <th scope="col" className={`${TH_CLASSES} text-left`}>
        <span className="inline-flex items-center gap-1.5">
          {column.name}
          <HiOutlineLockClosed
            className="h-3 w-3 shrink-0 text-gray-400"
            role="img"
            aria-label="Kolumna stała"
          />
        </span>
      </th>
    );
  }

  return (
    <th scope="col" className={`${TH_CLASSES} text-left`}>
      <div className="group flex items-center gap-0.5">
        <div className="whitespace-nowrap">
          <InlineEditField
            value={column.name}
            isEditing={isEditing}
            onStartEdit={onStartEdit}
            onCancel={onCancelEdit}
            onSave={onRename}
            canEdit
            saveOnBlur
            ariaLabel={`Nazwa kolumny ${column.name}`}
            displayClassName="uppercase overflow-visible!"
            inputClassName="animate-pop-in -my-0.5 h-5 min-w-36 field-sizing-content py-0 text-[11px] normal-case tracking-normal"
          />
        </div>
        <ActionMenu
          ariaLabel={`Akcje kolumny ${column.name}`}
          className={`flex h-6 w-6 shrink-0 items-center justify-center ${MENU_REVEAL_CLASSES}`}
          items={[
            { id: 'rename', label: 'Zmień nazwę', onSelect: onStartEdit },
            {
              id: 'delete',
              label: 'Usuń kolumnę',
              tone: 'danger',
              onSelect: onDelete,
            },
          ]}
        />
      </div>
    </th>
  );
}

interface AddColumnInputs {
  name: string;
  type: ColumnType;
}

const EMPTY_COLUMN: AddColumnInputs = { name: '', type: 'money' };

export function AddColumnButton({
  onAdd,
}: {
  onAdd: (name: string, type: ColumnType) => void;
}) {
  const { isOpen, close, toggle, buttonRef, panelRef, position } =
    useAnchoredPopup<HTMLButtonElement, HTMLDivElement>({
      offset: 4,
      viewportMargin: 8,
      flip: true,
      restoreFocus: true,
    });
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AddColumnInputs>({ defaultValues: EMPTY_COLUMN });
  const type = useWatch({ control, name: 'type' });

  const submit = handleSubmit(({ name, type }) => {
    onAdd(name.trim(), type);
    reset(EMPTY_COLUMN);
    close();
  });

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label="Dodaj kolumnę"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg text-darkGreen transition-colors hover:bg-lightGreen hover:text-darkGreenHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darkGreen"
      >
        <HiOutlinePlus className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <PopoverPanel
          panelRef={panelRef}
          position={position}
          align="right"
          width={280}
          role="dialog"
          ariaLabel="Dodaj kolumnę"
          className="p-4"
        >
          <form onSubmit={submit} className="space-y-3 normal-case">
            <div>
              <label
                htmlFor="budget-column-name"
                className={FIELD_LABEL_CLASSES}
              >
                Nazwa kolumny
              </label>
              <input
                id="budget-column-name"
                {...register('name', {
                  validate: (value) =>
                    value.trim().length > 0 || 'Podaj nazwę kolumny',
                })}
                autoFocus
                type="text"
                className={INPUT_CLASSES}
              />
              <FieldError message={errors.name?.message} />
            </div>
            <RadioPillGroup
              legend="Typ kolumny"
              options={COLUMN_TYPE_OPTIONS}
              value={type}
              registration={register('type')}
            />
            <div className="flex justify-end">
              <Button type="submit" size="small">
                Dodaj
              </Button>
            </div>
          </form>
        </PopoverPanel>
      )}
    </>
  );
}
