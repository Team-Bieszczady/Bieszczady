import { useState } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { Modal } from '../../../../../components/ui/Modal';
import { Button } from '../../../../../components/ui/Button';
import { DAY_FORMS, pluralizePl } from '../../../../../lib/pluralizePl';
import { formatStageDate } from '../../../utils/isoDate';
import type { StageShiftSuggestion } from '../../../utils/stageRules';

interface ShiftFollowingStagesDialogProps {
  stageName: string;
  shiftDays: number;
  suggestions: StageShiftSuggestion[];
  onClose: () => void;
  onShift: (suggestions: StageShiftSuggestion[]) => void;
}

export default function ShiftFollowingStagesDialog({
  stageName,
  shiftDays,
  suggestions,
  onClose,
  onShift,
}: ShiftFollowingStagesDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    suggestions.map((item) => item.stageId),
  );

  const toggle = (stageId: string) =>
    setSelectedIds((current) =>
      current.includes(stageId)
        ? current.filter((id) => id !== stageId)
        : [...current, stageId],
    );

  const confirm = () =>
    onShift(suggestions.filter((item) => selectedIds.includes(item.stageId)));

  return (
    <Modal isOpen onClose={onClose} title="Przesunąć kolejne etapy?" size="lg">
      <div className="space-y-5">
        <p className="rounded-lg bg-amberSoft px-3 py-2.5 text-xs leading-relaxed text-amberDark">
          Termin etapu „{stageName}” przesunął się o{' '}
          {pluralizePl(Math.abs(shiftDays), DAY_FORMS)}. Kolejne etapy zachowały
          stare terminy — sprawdź, czy nadal są realne.
        </p>

        <ul className="flex flex-col gap-2">
          {suggestions.map((item) => {
            const isChecked = selectedIds.includes(item.stageId);

            return (
              <li key={item.stageId}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors focus-within:ring-1 focus-within:ring-darkGreen ${
                    isChecked
                      ? 'border-darkGreen bg-lightGreen/40'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(item.stageId)}
                    className="h-3.5 w-3.5 shrink-0 accent-darkGreen"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-dark">
                    {item.name}
                  </span>
                  <span className="shrink-0 text-[11px] text-mutedText line-through decoration-1 max-500:hidden">
                    {formatStageDate(item.currentDeadline)}
                  </span>
                  <FiArrowRight
                    className="h-3 w-3 shrink-0 text-mutedText max-500:hidden"
                    aria-hidden="true"
                  />
                  <span className="shrink-0 text-[11px] font-semibold text-darkGreen">
                    {formatStageDate(item.suggestedDeadline)}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <p className="text-[11px] leading-relaxed text-grayText">
          Nic nie zostanie przesunięte automatycznie — zmienią się tylko
          zaznaczone etapy.
        </p>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button variant="ghost" size="small" type="button" onClick={onClose}>
            Zostaw bez zmian
          </Button>
          <Button
            variant="primary"
            size="small"
            type="button"
            disabled={selectedIds.length === 0}
            onClick={confirm}
            className="font-medium!"
          >
            Przesuń zaznaczone
          </Button>
        </div>
      </div>
    </Modal>
  );
}
