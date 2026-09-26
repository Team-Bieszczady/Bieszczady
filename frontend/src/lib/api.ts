import type { DocumentKind, DocumentStatus } from './documents';
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
  taskCount?: number;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface BackendFolder {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface BackendDocumentVersion {
  id: string;
  documentId: string;
  versionNo: number;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  changeNote: string | null;
  uploadedById: string;
  createdAt: string;
  uploadedBy: { firstName: string; lastName: string };
}

export interface BackendDocumentAccess {
  id: string;
  projectId: string;
  folderId: string | null;
  documentId: string | null;
  userId: string;
  level: 'VIEW' | 'EDIT';
  grantedById: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
}

export interface BackendDocument {
  id: string;
  projectId: string;
  folderId: string;
  name: string;
  kind: DocumentKind;
  status: DocumentStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  versions: BackendDocumentVersion[];
  folder?: { name: string; deletedAt: string | null };
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

async function throwFromResponse(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
  const message = body.message
    ? [body.message].flat().join(', ')
    : fallbackMessage;
  throw createApiError(response.status, message);
}


interface RequestInitOptions {
  method: string;
  accessToken?: string | null;
  body?: object;
  fallbackMessage: string;
}

export async function request<T>(

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
    await throwFromResponse(response, fallbackMessage);
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

async function sendWithRefresh(
  path: string,
  init: RequestInit,
  accessToken: string,
): Promise<Response> {
  const send = (token: string) =>
    fetch(`${API_BASE_URL}${path}`, {
     ...init,
     headers: {...init.headers, Authorization:`Bearer ${token}` }

    });
  let response = await send(accessToken);
 if (response.status === 401 && accessToken) {
    const freshToken = await refreshAccessToken();
    if (freshToken) {
      response = await send(freshToken);
    }
  }
  return response
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

  async getUserModules(
    accessToken: string,
    id: string,
  ): Promise<{ modules: ModuleKey[] }> {
    return request<{ modules: ModuleKey[] }>(`/api/v1/users/${id}/modules`, {
      method: 'GET',
      accessToken,
      fallbackMessage: 'Nie udało się pobrać dostępu do modułów',
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
  async getFolders(
    accessToken: string,
    projectId: string,
  ): Promise<BackendFolder[]> {
    return request<BackendFolder[]>(`/api/v1/projects/${projectId}/folders`, {
      method: 'GET',
      accessToken,
      fallbackMessage: 'Nie udało się pobrać folderów',
    });
  },

  async createFolder(
    accessToken: string,
    projectId: string,
    body: { name: string; parentId?: string },
  ): Promise<BackendFolder> {
    return request<BackendFolder>(`/api/v1/projects/${projectId}/folders`, {
      method: 'POST',
      accessToken,
      body,
      fallbackMessage: 'Nie udało się dodać folderu',
    });
  },
  async updateFolder(
    accessToken: string,
    projectId: string,
    folderId: string,
    body: { name?: string; parentId?: string },
  ): Promise<BackendFolder> {
    return request<BackendFolder>(
      `/api/v1/projects/${projectId}/folders/${folderId}`,
      {
        method: 'PATCH',
        accessToken,
        body,
        fallbackMessage: 'Nie udało się zaktualizować folderu',
      },
    );
  },

  async deleteFolder(
    accessToken: string,
    projectId: string,
    folderId: string,
  ): Promise<BackendFolder> {
    return request<BackendFolder>(
      `/api/v1/projects/${projectId}/folders/${folderId}`,
      {
        method: 'DELETE',
        accessToken,
        fallbackMessage: 'Nie udało się usunąć folderu',
      },
    );
  },

  async getDocuments(
    accessToken: string,
    projectId: string,
    folderId: string,
  ): Promise<BackendDocument[]> {
    return request<BackendDocument[]>(
      `/api/v1/projects/${projectId}/folders/${folderId}/documents`,
      {
        method: 'GET',
        accessToken,
        fallbackMessage: 'Nie udało się pobrać dokumentów',
      },
    );
  },

  async getTrash(
    accessToken: string,
    projectId: string,
  ): Promise<BackendDocument[]> {
    return request<BackendDocument[]>(
      `/api/v1/projects/${projectId}/documents/trash`,
      {
        method: 'GET',
        accessToken,
        fallbackMessage: 'Nie udało się pobrać dokumentów',
      },
    );
  },

  async downloadVersion(
    accessToken: string,
    projectId: string,
    documentId: string,
    versionNo: number,
  ): Promise<Blob> {
    const response = await sendWithRefresh(
      `/api/v1/projects/${projectId}/documents/${documentId}/versions/${versionNo}/download`,
      { method: 'GET', credentials: 'include' },
      accessToken,
    );

    if (!response.ok) {
         await throwFromResponse(response, 'Nie udało się pobrać pliku');
    }

    return response.blob();
  },

  async uploadDocument(
    accessToken: string,
    projectId: string,
    folderId: string,
    formData: FormData,
  ): Promise<BackendDocument> {
    const response = await sendWithRefresh(
      `/api/v1/projects/${projectId}/folders/${folderId}/documents`,
      { method: 'POST', credentials: 'include', body: formData },
      accessToken,
    );

    if (!response.ok) {
           await throwFromResponse(response, 'Nie udało się wgrać pliku');
    }

    return response.json();
  },

  async restoreVersion(
    accessToken: string,
    projectId: string,
    documentId: string,
    versionNo: number,
  ): Promise<BackendDocumentVersion> {
    return request<BackendDocumentVersion>(
      `/api/v1/projects/${projectId}/documents/${documentId}/versions/${versionNo}/restore`,
      {
        method: 'POST',
        accessToken,
        fallbackMessage: 'Nie udało się przywrócić wersji',
      },
    );
  },

  async uploadVersion(
    accessToken: string,
    projectId: string,
    documentId: string,
    formData: FormData,
  ): Promise<BackendDocumentVersion> {
    const response = await sendWithRefresh(
      `/api/v1/projects/${projectId}/documents/${documentId}/versions`,
      { method: 'POST', credentials: 'include', body: formData },
      accessToken,
    );

    if (!response.ok) {
      await throwFromResponse(response, 'Nie udało się wgrać wersji');
    }

    return response.json();
  },

  async getVersions(
    accessToken: string,
    projectId: string,
    documentId: string,
  ): Promise<BackendDocumentVersion[]> {
    return request<BackendDocumentVersion[]>(
      `/api/v1/projects/${projectId}/documents/${documentId}/versions`,
      {
        method: 'GET',
        accessToken,
        fallbackMessage: 'Nie udało się pobrać historii wersji',
      },
    );
  },

  async deleteDocument(
    accessToken: string,
    projectId: string,
    documentId: string,
  ): Promise<BackendDocument> {
    return request<BackendDocument>(
      `/api/v1/projects/${projectId}/documents/${documentId}`,
      {
        method: 'DELETE',
        accessToken,
        fallbackMessage: 'Nie udało się usunąć dokumentu',
      },
    );
  },
  async deleteDocumentPermanently(
    accessToken: string,
    projectId: string,
    documentId: string,
  ): Promise<void> {
    return request<void>(
      `/api/v1/projects/${projectId}/documents/${documentId}/permanent`,
      {
        method: 'DELETE',
        accessToken,
        fallbackMessage: 'Nie udało się trwale usunąć dokumentu',
      },
    );
  },
  async restoreDocument(
    accessToken: string,
    projectId: string,
    documentId: string,
    body?: { folderId?: string },
  ): Promise<BackendDocument> {
    return request<BackendDocument>(
      `/api/v1/projects/${projectId}/documents/${documentId}/restore`,
      {
        method: 'POST',
        accessToken,
        body,
        fallbackMessage: 'Nie udało się przywrócić dokumentu',
      },
    );
  },

  async updateDocument(
    accessToken: string,
    projectId: string,
    documentId: string,
    body: { name: string },
  ): Promise<BackendDocument> {
    return request<BackendDocument>(
      `/api/v1/projects/${projectId}/documents/${documentId}`,
      {
        method: 'PATCH',
        accessToken,
        body,
        fallbackMessage: 'Nie udało się zmienić nazwy dokumentu',
      },
    );
  },

  async approveDocument(
    accessToken: string,
    projectId: string,
    documentId: string,
  ): Promise<BackendDocument> {
    return request<BackendDocument>(
      `/api/v1/projects/${projectId}/documents/${documentId}/approve`,
      {
        method: 'POST',
        accessToken,
        fallbackMessage: 'Nie udało się potwierdzić dokumentu',
      },
    );
  },

  async getPendingCount(
    accessToken: string,
    projectId: string,
  ): Promise<{ count: number }> {
    return request<{ count: number }>(
      `/api/v1/projects/${projectId}/documents/pending-count`,
      {
        method: 'GET',
        accessToken,
        fallbackMessage: 'Nie udało się sprawdzić dokumentów do akceptacji',
      },
    );
  },

  async getDocumentAccess(
    accessToken: string,
    projectId: string,
    body: { folderId?: string; documentId?: string },
  ): Promise<BackendDocumentAccess[]> {
    const url = `/api/v1/projects/${projectId}/document-access`;
    const params = new URLSearchParams();

    if (body.folderId) {
      params.set('folderId', body.folderId);
    }
    if (body.documentId) {
      params.set('documentId', body.documentId);
    }

    return request<BackendDocumentAccess[]>(`${url}?${params}`, {
      method: 'GET',
      accessToken,
      fallbackMessage: 'Nie udało się pobrać listy dostępów',
    });
  },

  async grantDocumentAccess(
    accessToken: string,
    projectId: string,
    body: {
      userId: string;
      level: 'VIEW' | 'EDIT';
      folderId?: string;
      documentId?: string;
    },
  ): Promise<BackendDocumentAccess> {
    return request<BackendDocumentAccess>(
      `/api/v1/projects/${projectId}/document-access`,
      {
        method: 'POST',
        accessToken,
        body,
        fallbackMessage: 'Nie udało się udostępnić',
      },
    );
  },

  async revokeDocumentAccess(
    accessToken: string,
    projectId: string,
accessId: string
  ): Promise<void> {
    await request<void>(
      `/api/v1/projects/${projectId}/document-access/${accessId}`,
      {
        method: 'DELETE',
        accessToken,
        fallbackMessage: 'Nie udało się odebrać dostępu',
      },
    );
  },
}; 


export { isApiError };
