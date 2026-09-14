import { createContext } from 'react';

const storageKey = (userId: string) => `selectedProjectId:${userId}`;

const LEGACY_KEY = 'selectedProjectId';

export function readStoredProjectId(userId: string): string | null {
  try {
    localStorage.removeItem(LEGACY_KEY);
    return localStorage.getItem(storageKey(userId));
  } catch {
    console.error();

    return null;
  }
}

export function writeStoredProjectId(userId: string, projectId: string): void {
  try {
    localStorage.setItem(storageKey(userId), projectId);
  } catch {
    console.error();
  }
}

export function clearStoredProjectId(userId: string): void {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    console.error();
  }
}

export interface SelectedProjectContextType {
  projectId: string | null;
  setProjectId: (id: string) => void;
}

export const SelectedProjectContext = createContext<
  SelectedProjectContextType | undefined
>(undefined);
