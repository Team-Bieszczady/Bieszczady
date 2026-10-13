import { Modal } from '../../../components/ui/Modal';
import { formatDate, formatTime } from '../../people/utils/formatDateTime';
import {
  HISTORY_KIND_LABELS,
  VERSION_STATUS_CLASSES,
  VERSION_STATUS_LABELS,
} from '../data';
import type { BudgetStore } from '../types';
import { calcPlanTotals, formatMoney } from '../utils/budgetTotals';

interface BudgetHistoryModalProps {
  store: BudgetStore;
  onClose: () => void;
}

export function BudgetHistoryModal({
  store,
  onClose,
}: BudgetHistoryModalProps) {
  const versions = [...store.versions].sort((a, b) => a.number - b.number);
  const entries = [...store.history].reverse();

  return (
    <Modal isOpen onClose={onClose} title="Historia zmian" size="lg">
      <div className="space-y-6">
        <section>
          <h3 className="mb-2 text-xs tracking-wide text-grayText uppercase">
            Wersje
          </h3>
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
            {versions.map((version) => (
              <li
                key={version.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs"
              >
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-dark">
                    {version.name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${VERSION_STATUS_CLASSES[version.status]}`}
                  >
                    {version.isCurrent
                      ? 'Aktualny'
                      : VERSION_STATUS_LABELS[version.status]}
                  </span>
                </span>
                <span className="flex items-center gap-4 text-grayText">
                  <span>
                    {formatDate(version.approvedAt ?? version.createdAt)}
                  </span>
                  <span className="font-semibold text-dark tabular-nums">
                    {formatMoney(calcPlanTotals(version.categories).planned)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-xs tracking-wide text-grayText uppercase">
            Zdarzenia
          </h3>
          {entries.length === 0 ? (
            <p className="py-6 text-center text-xs text-grayText">
              Brak zdarzeń
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 rounded-lg border border-l-4 border-gray-200 border-l-darkGreen">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-baseline justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-dark">
                      <span className="font-bold">{entry.by.name}</span>
                      {' · '}
                      {HISTORY_KIND_LABELS[entry.kind]}{' '}
                      <span className="font-semibold">{entry.versionName}</span>
                    </p>
                    {entry.comment && (
                      <p className="mt-1 text-xs text-grayText italic">
                        „{entry.comment}”
                      </p>
                    )}
                  </div>
                  <time
                    dateTime={entry.at}
                    className="shrink-0 text-xs whitespace-nowrap text-grayText"
                  >
                    {formatDate(entry.at)}, {formatTime(entry.at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}
