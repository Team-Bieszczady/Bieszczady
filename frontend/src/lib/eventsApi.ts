import { request } from './api';
import type { NamedRef, PersonRef } from './projectsApi';

const BASE = '/api/v1';

export type EventSource = 'AUTOMATIC' | 'MANUAL';

export type BackendEventActor = PersonRef;

export interface BackendEvent {
  id: string;
  source: EventSource;
  content: string;
  createdAt: string;
  actor: BackendEventActor | null;
  project: NamedRef & { color: string };
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
