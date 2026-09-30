import type { BackendEvent } from '../../../lib/eventsApi';
import { formatDate, formatTime } from '../../people/utils/formatDateTime';
import { contentToSegments } from '../utils/contentToSegments';
import type { DecisionDayGroup } from '../utils/decisionHistory';

interface DecisionHistoryListProps {
  groups: DecisionDayGroup[];
  emptyMessage?: string;
}

/** Null for events nobody performed — those print without a name. */
function actorName(actor: BackendEvent['actor']): string | null {
  return actor ? `${actor.firstName} ${actor.lastName}` : null;
}

export default function DecisionHistoryList({
  groups,
  emptyMessage,
}: DecisionHistoryListProps) {
  if (groups.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-grayText">
        {emptyMessage ?? 'Brak decyzji'}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.day}>
          <h2 className="mb-2 text-xs tracking-wide text-grayText uppercase">
            {formatDate(group.events[0].createdAt)}
          </h2>

          <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 border-l-4 border-l-darkGreen bg-white px-4 800:px-6">
            {group.events.map((event) => {
              const person = actorName(event.actor);

              return (
                <li
                  key={event.id}
                  className="flex items-baseline justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-dark">
                      {person && <span className="font-bold">{person} </span>}
                      {contentToSegments(event.content).map(
                        (segment, index) => (
                          <span
                            key={index}
                            className={segment.strong ? 'font-bold' : undefined}
                          >
                            {segment.text}
                          </span>
                        ),
                      )}
                    </p>
                    <span className="mt-1 block text-xs text-grayText">
                      {event.project.name}
                    </span>
                  </div>
                  <time
                    dateTime={event.createdAt}
                    className="shrink-0 text-xs text-grayText"
                  >
                    {formatTime(event.createdAt)}
                  </time>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
