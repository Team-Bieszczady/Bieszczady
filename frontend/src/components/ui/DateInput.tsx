import { useState, type CSSProperties } from 'react';
import { DayPicker } from 'react-day-picker';
import { pl } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { format, isValid, parse, parseISO } from 'date-fns';
import { LuCalendar } from 'react-icons/lu';
import { useAnchoredPopup } from '../../hooks/useAnchoredPopup';
import {
  formatNumericDate,
  toIsoDate,
} from '../../features/projects/utils/isoDate';
import { PopoverPanel } from './PopoverPanel';
import { INPUT_CLASSES } from './formStyles';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  min?: string;
  max?: string;
  invalid?: boolean;
  autoFocus?: boolean;
  'aria-describedby'?: string;
  placeholder?: string;
}

const TYPED_FORMAT = 'dd.MM.yyyy';

const CALENDAR_STYLE = {
  '--rdp-accent-color': 'var(--color-darkGreen)',
  '--rdp-accent-background-color': 'var(--color-lightGreen)',
  '--rdp-day-height': '36px',
  '--rdp-day-width': '36px',
  '--rdp-day_button-height': '34px',
  '--rdp-day_button-width': '34px',
} as CSSProperties;

function maskTyped(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)]
    .filter(Boolean)
    .join('.');
}

export function DateInput({
  value,
  onChange,
  onBlur,
  id,
  min,
  max,
  invalid = false,
  autoFocus,
  'aria-describedby': describedBy,
  placeholder = 'dd.mm.rrrr',
}: DateInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const { isOpen, toggle, close, buttonRef, panelRef, position } =
    useAnchoredPopup<HTMLDivElement, HTMLDivElement>({
      offset: 4,
      viewportMargin: 8,
      flip: true,
      preferredHeight: 360,
    });

  const iso = value ? toIsoDate(value) : '';
  const selected = iso ? parseISO(iso) : undefined;
  const minDate = min ? parseISO(toIsoDate(min)) : undefined;
  const maxDate = max ? parseISO(toIsoDate(max)) : undefined;

  const commitTyped = () => {
    if (draft === null) return;
    setDraft(null);

    if (draft === '') {
      if (value) onChange('');
      return;
    }
    const typed = parse(draft, TYPED_FORMAT, new Date());
    if (isValid(typed) && draft.length === TYPED_FORMAT.length) {
      const next = format(typed, 'yyyy-MM-dd');
      if (next !== iso) onChange(next);
    }
  };

  const pick = (day: Date | undefined) => {
    if (day) onChange(format(day, 'yyyy-MM-dd'));
    setDraft(null);
    close();
    onBlur?.();
  };

  return (
    <>
      <div ref={buttonRef} className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={draft ?? (iso ? formatNumericDate(iso) : '')}
          onChange={(event) => setDraft(maskTyped(event.target.value))}
          onBlur={() => {
            commitTyped();
            onBlur?.();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitTyped();
            }
          }}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={`${INPUT_CLASSES} pr-9 ${invalid ? 'border-darkRed' : ''}`}
        />
        <button
          type="button"
          onClick={toggle}
          aria-label="Wybierz datę z kalendarza"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-lg text-dark/60 transition-colors hover:text-darkGreen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-darkGreen"
        >
          <LuCalendar className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {isOpen && (
        <PopoverPanel
          panelRef={panelRef}
          position={position}
          role="dialog"
          ariaLabel="Kalendarz"
          minWidth={0}
          centerOnMobile
          className="p-2 text-xs max-sm:w-auto"
        >
          <DayPicker
            mode="single"
            locale={pl}
            selected={selected}
            onSelect={pick}
            defaultMonth={selected ?? minDate ?? new Date()}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            autoFocus
            style={CALENDAR_STYLE}
            className="mx-auto w-fit"
          />
        </PopoverPanel>
      )}
    </>
  );
}
