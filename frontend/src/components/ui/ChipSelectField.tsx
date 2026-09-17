import { useForm, useWatch } from 'react-hook-form';
import { AiOutlineSearch } from 'react-icons/ai';
import { HiOutlinePlus } from 'react-icons/hi';
import { useAnchoredPopup } from '../../hooks/useAnchoredPopup';
import { normalizeText } from '../../lib/normalizeText';
import { Chip } from './Chip';
import { AddChipButton } from './AddChipButton';
import { PopoverPanel } from './PopoverPanel';

interface ChipSearchPanelProps {
  options: ReadonlyArray<string>;
  selected: ReadonlyArray<string>;
  searchPlaceholder: string;
  onPick: (value: string) => void;
  onCreate: (value: string) => void;
}

function ChipSearchPanel({
  options,
  selected,
  searchPlaceholder,
  onPick,
  onCreate,
}: ChipSearchPanelProps) {
  const { register, control } = useForm<{ search: string }>({
    defaultValues: { search: '' },
  });
  const search = useWatch({ control, name: 'search' }) ?? '';

  const query = normalizeText(search);
  const available = options.filter((option) => !selected.includes(option));
  const matches = query
    ? available.filter((option) => normalizeText(option).includes(query))
    : available;

  const trimmed = search.trim();
  const existsAnywhere = options.some(
    (option) => normalizeText(option) === query,
  );
  const canCreate = trimmed.length > 0 && !existsAnywhere;

  return (
    <>
      <div className="relative p-1">
        <AiOutlineSearch
          className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          {...register('search')}
          autoFocus
          type="text"
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-8 w-full rounded-md border border-gray-200 pr-2 pl-8 text-xs focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none"
        />
      </div>

      {matches.length === 0 && !canCreate && (
        <p className="px-2 py-3 text-center text-xs text-grayText">
          Brak pasujących wartości
        </p>
      )}

      {matches.map((option) => (
        <button
          key={option}
          type="button"
          role="option"
          aria-selected={false}
          onClick={() => onPick(option)}
          className="flex w-full cursor-pointer items-center rounded-md p-2 text-left text-xs text-dark transition-colors hover:bg-gray-50"
        >
          <span className="truncate">{option}</span>
        </button>
      ))}

      {canCreate && (
        <div className="mt-1 border-t border-gray-100 pt-1">
          <button
            type="button"
            onClick={() => onCreate(trimmed)}
            className="flex w-full cursor-pointer items-center gap-1.5 rounded-md p-2 text-left text-xs font-medium text-darkGreen transition-colors hover:bg-gray-50"
          >
            <HiOutlinePlus
              className="h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">Utwórz: „{trimmed}”</span>
          </button>
        </div>
      )}
    </>
  );
}

interface ChipSelectFieldProps {
  label: string;
  values: ReadonlyArray<string>;
  options: ReadonlyArray<string>;
  onAdd: (value: string) => void;
  onCreate: (value: string) => void;
  onRemove: (value: string) => void;
  canEdit: boolean;
  addLabel?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
}

export function ChipSelectField({
  label,
  values,
  options,
  onAdd,
  onCreate,
  onRemove,
  canEdit,
  addLabel = '+ dodaj',
  searchPlaceholder = 'Szukaj...',
  emptyLabel = 'Brak',
}: ChipSelectFieldProps) {
  const { isOpen, close, toggle, buttonRef, panelRef, position } =
    useAnchoredPopup<HTMLButtonElement, HTMLDivElement>({
      offset: 4,
      viewportMargin: 8,
      flip: true,
      preferredHeight: 280,
      restoreFocus: true,
    });

  const pick = (value: string) => {
    onAdd(value);
    close();
    buttonRef.current?.focus();
  };

  const create = (value: string) => {
    onCreate(value);
    close();
    buttonRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-1.5 800:flex-row 800:flex-wrap 800:items-center 800:gap-2">
      <span className="text-[10px] font-semibold tracking-[0.5px] text-mutedText 800:w-20 800:shrink-0 800:text-[11px]">
        {label}
      </span>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {values.map((value) => (
          <Chip
            key={value}
            label={value}
            onRemove={canEdit ? () => onRemove(value) : undefined}
            removeLabel={`Usuń ${value} z projektu`}
          />
        ))}

        {values.length === 0 && !canEdit && (
          <span className="text-[11px] text-mutedText">{emptyLabel}</span>
        )}

        {canEdit && (
          <AddChipButton
            ref={buttonRef}
            label={addLabel}
            onClick={toggle}
            isExpanded={isOpen}
          />
        )}
      </div>

      {isOpen && (
        <PopoverPanel
          panelRef={panelRef}
          position={position}
          minWidth={220}
          centerOnMobile
          role="listbox"
          ariaLabel={label}
        >
          <ChipSearchPanel
            options={options}
            selected={values}
            searchPlaceholder={searchPlaceholder}
            onPick={pick}
            onCreate={create}
          />
        </PopoverPanel>
      )}
    </div>
  );
}
