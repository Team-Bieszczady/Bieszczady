import { type ModuleKey } from './modules';

export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isDirector: boolean;
  accountStatus: AccountStatus;
  mustChangePassword: boolean;
  modules: ModuleKey[];
}

export interface BackendUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  accountStatus: AccountStatus;
  isDirector: boolean;
  mustChangePassword: boolean;
  modules?: ModuleKey[];
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

export type ApiError = Error & { status: number };

interface ApiErrorBody {
  message?: string | string[];
}

function isApiError(error: Error | null): error is ApiError {
  return error instanceof Error && 'status' in error;
}

function createApiError(status: number, message: string): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  return error;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

type RefreshHandler = () => Promise<string | null>;

let refreshHandler: RefreshHandler | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function registerRefreshHandler(handler: RefreshHandler | null): void {
  refreshHandler = handler;
}
function refreshAccessToken(): Promise<string | null> {
  if (!refreshHandler) return Promise.resolve(null);

  refreshInFlight ??= refreshHandler().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

interface RequestInitOptions {
  method: string;
  accessToken?: string | null;
  body?: object;
  fallbackMessage: string;
}

async function request<T>(
  path: string,
  { method, accessToken, body, fallbackMessage }: RequestInitOptions,
): Promise<T> {
  const send = (token: string | null | undefined) =>
    fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  let response = await send(accessToken);

  if (response.status === 401 && accessToken) {
    const freshToken = await refreshAccessToken();
    if (freshToken) {
      response = await send(freshToken);
    }
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    const message = body.message
      ? [body.message].flat().join(', ')
      : fallbackMessage;
    throw createApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

export const api = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw createApiError(
        response.status,
        `Login failed with status ${response.status}`,
      );
    }

    return response.json();
  },

  async changePassword(
    accessToken: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/v1/users/me/password', {
      method: 'POST',
      accessToken,
      body: { currentPassword, newPassword },
      fallbackMessage: 'Nie udało się zmienić hasła',
    });
  },

  async getCurrentUser(accessToken: string): Promise<BackendUser> {
    return request<BackendUser>('/api/v1/users/me', {
      method: 'GET',
      accessToken,
      fallbackMessage: 'Nie udało się pobrać danych użytkownika',
    });
  },
  async getUsers(
    accessToken: string,
    options: { includeDeleted?: boolean } = {},
  ): Promise<BackendUser[]> {
    const query = options.includeDeleted ? '?includeDeleted=true' : '';
    return request<BackendUser[]>(`/api/v1/users${query}`, {
      method: 'GET',
      accessToken,
      fallbackMessage: 'Nie udało się pobrać listy użytkowników',
    });
  },

  async getUserById(accessToken: string, id: string): Promise<BackendUser> {
    return request<BackendUser>(`/api/v1/users/${id}`, {
      method: 'GET',
      accessToken,
      fallbackMessage: 'Nie udało się pobrać danych osoby',
    });
  },

  async createUser(
    accessToken: string,
    payload: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      password: string;
      modules?: ModuleKey[];
    },
  ): Promise<BackendUser> {
    return request<BackendUser>('/api/v1/users', {
      method: 'POST',
      accessToken,
      body: payload,
      fallbackMessage: 'Nie udało się utworzyć użytkownika',
    });
  },

  async updateUserModules(
    accessToken: string,
    id: string,
    modules: ModuleKey[],
  ): Promise<{ modules: ModuleKey[] }> {
    return request<{ modules: ModuleKey[] }>(`/api/v1/users/${id}/modules`, {
      method: 'PATCH',
      accessToken,
      body: { modules },
      fallbackMessage: 'Nie udało się zaktualizować dostępu do modułów',
    });
  },

  async updateSelf(
    accessToken: string,
    id: string,
    payload: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatar?: string;
    },
  ): Promise<BackendUser> {
    return request<BackendUser>(`/api/v1/users/${id}`, {
      method: 'PATCH',
      accessToken,
      body: payload,
      fallbackMessage: 'Nie udało się zapisać zmian',
    });
  },

  async setAccountStatus(
    accessToken: string,
    id: string,
    accountStatus: AccountStatus,
  ): Promise<BackendUser> {
    return request<BackendUser>(`/api/v1/users/${id}/status`, {
      method: 'PATCH',
      accessToken,
      body: { accountStatus },
      fallbackMessage: 'Nie udało się zmienić statusu konta',
    });
  },

  async setDirectorStatus(
    accessToken: string,
    id: string,
    isDirector: boolean,
  ): Promise<BackendUser> {
    return request<BackendUser>(`/api/v1/users/${id}/director-status`, {
      method: 'PATCH',
      accessToken,
      body: { isDirector },
      fallbackMessage: 'Nie udało się zmienić uprawnień dyrektora',
    });
  },

  async softDeleteUser(accessToken: string, id: string): Promise<void> {
    return request<void>(`/api/v1/users/${id}`, {
      method: 'DELETE',
      accessToken,
      fallbackMessage: 'Nie udało się usunąć konta',
    });
  },

  async refresh(): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw createApiError(
        response.status,
        `Refresh failed with status ${response.status}`,
      );
    }

    return response.json();
  },

  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw createApiError(
        response.status,
        `Logout failed with status ${response.status}`,
      );
    }
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return request<{ message: string }>('/api/v1/auth/password-reset/request', {
      method: 'POST',
      body: { email },
      fallbackMessage: 'Nie udało się wysłać linku',
    });
  },

  async confirmPasswordReset(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ message: string }> {
    return request<{ message: string }>('/api/v1/auth/password-reset/confirm', {
      method: 'POST',
      body: { token, newPassword, confirmPassword },
      fallbackMessage: 'Nie udało się zmienić hasła',
    });
  },
};

export { isApiError };
