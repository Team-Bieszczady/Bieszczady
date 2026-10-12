import type { CalendarView } from './calendarView';

export interface CalendarSettings {
  view: CalendarView;
  hiddenProjectIds: string[];
  showMeetings: boolean;
  showDeadlines: boolean;
}

const DEFAULT_SETTINGS: CalendarSettings = {
  view: 'month',
  hiddenProjectIds: [],
  showMeetings: true,
  showDeadlines: true,
};

const VIEWS: string[] = ['day', 'week', 'month'];

const storageKey = (userId: string) => `calendarSettings:${userId}`;

function isTextList(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

export function readCalendarSettings(userId: string | null): CalendarSettings {
  if (!userId) {
    return DEFAULT_SETTINGS;
  }

  try {
    const text = localStorage.getItem(storageKey(userId));
    if (!text) {
      return DEFAULT_SETTINGS;
    }

    const saved = JSON.parse(text) as Record<string, unknown>;
    const settings: CalendarSettings = {
      view: DEFAULT_SETTINGS.view,
      hiddenProjectIds: DEFAULT_SETTINGS.hiddenProjectIds,
      showMeetings: DEFAULT_SETTINGS.showMeetings,
      showDeadlines: DEFAULT_SETTINGS.showDeadlines,
    };

    if (typeof saved.view === 'string' && VIEWS.includes(saved.view)) {
      settings.view = saved.view as CalendarView;
    }
    if (isTextList(saved.hiddenProjectIds)) {
      settings.hiddenProjectIds = saved.hiddenProjectIds;
    }
    if (typeof saved.showMeetings === 'boolean') {
      settings.showMeetings = saved.showMeetings;
    }
    if (typeof saved.showDeadlines === 'boolean') {
      settings.showDeadlines = saved.showDeadlines;
    }

    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeCalendarSettings(
  userId: string | null,
  settings: CalendarSettings,
) {
  if (!userId) {
    return;
  }

  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(settings));
  } catch {
    return;
  }
}
