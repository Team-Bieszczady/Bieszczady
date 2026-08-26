export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isDirector: boolean;
  accountStatus: 'ACTIVE' | 'INACTIVE';
  mustChangePassword: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

export type ApiError = Error & { status: number };

function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && 'status' in error;
}

function createApiError(status: number, message: string): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  return error;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

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
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      throw createApiError(
        response.status,
        `Password change failed with status ${response.status}`,
      );
    }

    return response.json();
  },
};

export { isApiError };
