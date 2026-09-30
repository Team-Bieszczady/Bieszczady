import { request } from './api';

const BASE = '/api/v1';

export type EventSource = 'AUTOMATIC' | 'MANUAL';

export interface BackendEventActor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface BackendEvent {
  id: string;
  source: EventSource;
  /** The Polish predicate only — the actor's name is rendered separately. */
  content: string;
  createdAt: string;
  actor: BackendEventActor | null;
  project: { id: string; name: string; color: string };
}

export interface BackendEventPage {
  items: BackendEvent[];
  nextCursor: string | null;
}

export interface ListEventsParams {
  projectId?: string;
  from?: string;
  cursor?: string;
}

const get = <T>(accessToken: string, path: string, fallbackMessage: string) =>
  request<T>(`${BASE}${path}`, { method: 'GET', accessToken, fallbackMessage });

const send = <T>(
  method: 'POST',
  accessToken: string,
  path: string,
  fallbackMessage: string,
  body?: object,
) =>
  request<T>(`${BASE}${path}`, { method, accessToken, body, fallbackMessage });

/** Empty params are dropped — the backend validates `projectId` as a UUID and
 * `from` as a date, so sending a blank one is a 400 rather than "no filter". */
function toQuery(params: ListEventsParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

export const eventsApi = {
  list: (accessToken: string, params: ListEventsParams = {}) =>
    get<BackendEventPage>(
      accessToken,
      `/events${toQuery(params)}`,
      'Nie udało się pobrać historii decyzji',
    ),
  create: (accessToken: string, body: { projectId: string; content: string }) =>
    send<BackendEvent>(
      'POST',
      accessToken,
      '/events',
      'Nie udało się zapisać decyzji',
      body,
    ),
};
