import { useState } from 'react';
import { LuClock } from 'react-icons/lu';
import { useAnchoredPopup } from '../../hooks/useAnchoredPopup';
import { PopoverPanel } from './PopoverPanel';
import { INPUT_CLASSES } from './formStyles';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

const HOURS = Array.from({ length: 18 }, (_, index) => pad(index + 6));
const MINUTES = Array.from({ length: 12 }, (_, index) => pad(index * 5));

const SECTION_LABEL_CLASSES =
  'px-1 pb-1.5 text-[11px] font-semibold tracking-wide text-mutedText uppercase';
const OPTION_CLASSES =
  'h-8 cursor-pointer rounded-md text-xs font-medium tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-40';
const SELECTED_CLASSES = 'bg-darkGreen text-white';
const IDLE_CLASSES =
  'text-dark hover:bg-lightGreen disabled:hover:bg-transparent';

function normalizeTime(text: string): string | null {
  const match = /^\s*(\d{1,2})(?:[:.]?(\d{2}))?\s*$/.exec(text);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  if (hour > 23 || minute > 59) return null;

  return `${pad(hour)}:${pad(minute)}`;
}

interface TimeInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  placeholder?: string;
}

export function TimeInput({
  id,
  value,
  onChange,
  onBlur,
  invalid = false,
  placeholder = 'np. 10:30',
}: TimeInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const { isOpen, open, close, toggle, buttonRef, panelRef, position } =
    useAnchoredPopup<HTMLDivElement, HTMLDivElement>({
      offset: 4,
      viewportMargin: 8,
      flip: true,
      preferredHeight: 260,
    });

  const [selectedHour = '', selectedMinute = ''] = value.split(':');
  const hasHour = /^([01]\d|2[0-3])$/.test(selectedHour);

  const commitDraft = () => {
    if (draft === null) return;
    onChange(normalizeTime(draft) ?? draft.trim());
    setDraft(null);
  };

  const pickHour = (hour: string) => {
    const minute = /^[0-5]\d$/.test(selectedMinute) ? selectedMinute : '00';
    setDraft(null);
    onChange(`${hour}:${minute}`);
  };

  const pickMinute = (minute: string) => {
    setDraft(null);
    onChange(`${selectedHour}:${minute}`);
    close();
  };

  return (
    <div ref={buttonRef} className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={draft ?? value}
        placeholder={placeholder}
        aria-invalid={invalid}
        onClick={open}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          commitDraft();
          onBlur?.();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commitDraft();
          if (event.key === 'Tab') close();
        }}
        className={`${INPUT_CLASSES} pr-8`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Wybierz godzinę"
        onClick={toggle}
        className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-grayText hover:text-dark"
      >
        <LuClock size={14} />
      </button>

      {isOpen && (
        <PopoverPanel
          panelRef={panelRef}
          position={position}
          width={264}
          role="dialog"
          ariaLabel="Wybierz godzinę"
          className="p-2"
        >
          <p className={SECTION_LABEL_CLASSES}>Godzina</p>
          <div className="grid grid-cols-6 gap-1">
            {HOURS.map((hour) => (
              <button
                key={hour}
                type="button"
                aria-pressed={hour === selectedHour}
                onClick={() => pickHour(hour)}
                className={`${OPTION_CLASSES} ${hour === selectedHour ? SELECTED_CLASSES : IDLE_CLASSES}`}
              >
                {hour}
              </button>
            ))}
          </div>

          <p className={`${SECTION_LABEL_CLASSES} mt-3`}>Minuty</p>
          <div className="grid grid-cols-6 gap-1">
            {MINUTES.map((minute) => (
              <button
                key={minute}
                type="button"
                disabled={!hasHour}
                aria-pressed={hasHour && minute === selectedMinute}
                onClick={() => pickMinute(minute)}
                className={`${OPTION_CLASSES} ${hasHour && minute === selectedMinute ? SELECTED_CLASSES : IDLE_CLASSES}`}
              >
                :{minute}
              </button>
            ))}
          </div>
        </PopoverPanel>
      )}
    </div>
  );
}
