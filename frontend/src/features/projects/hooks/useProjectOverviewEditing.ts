import toast from 'react-hot-toast';
import type {
  BackendProject,
  DictionaryEntry,
  NamedRef,
} from '../../../lib/projectsApi';
import type { StatusColorId } from '../overviewStatuses';
import {
  recipientMutations,
  statusMutations,
  typeMutations,
  useProjectRecipients,
  useProjectStatuses,
  useProjectTypes,
  useSetProjectRecipients,
  useSetProjectStatus,
  useSetProjectTypes,
  useUpdateProject,
} from './useProjectsApi';

export interface ChipDictionary {
  values: string[];
  options: string[];
  add: (value: string) => void;
  create: (value: string) => void;
  remove: (value: string) => void;
}

export interface CreateStatusResult {
  ok: boolean;
  reason?: 'duplicate';
}

export interface DeleteStatusResult {
  ok: boolean;
  usage: number;
}

/**
 * One id for every error this hook raises, so a retry replaces the toast on
 * screen — including when it fails for a different reason — instead of stacking
 * a second one and leaving a ghost from the previous attempt.
 */
const ERROR_TOAST_ID = 'project-overview-error';

function usageFromMessage(message: string): number {
  const match = /(\d+)/.exec(message);
  return match ? Number(match[1]) : 0;
}

function optionNames(
  entries: DictionaryEntry[] | undefined,
  assigned: NamedRef[],
): string[] {
  const names = (entries ?? [])
    .filter((entry) => entry.active)
    .map((entry) => entry.name);

  for (const value of assigned) {
    if (!names.includes(value.name)) names.push(value.name);
  }

  return names;
}

export function useProjectOverviewEditing(project: BackendProject) {
  const statuses = useProjectStatuses();
  const types = useProjectTypes();
  const recipients = useProjectRecipients();

  const updateProject = useUpdateProject(project.id);
  const setProjectStatus = useSetProjectStatus(project.id);
  const setProjectTypes = useSetProjectTypes(project.id);
  const setProjectRecipients = useSetProjectRecipients(project.id);

  const createStatusEntry = statusMutations.useCreate();
  const updateStatusEntry = statusMutations.useUpdate();
  const deleteStatusEntry = statusMutations.useDelete();
  const createTypeEntry = typeMutations.useCreate();
  const createRecipientEntry = recipientMutations.useCreate();

  const run = async (
    work: Promise<unknown>,
    success: string,
  ): Promise<boolean> => {
    try {
      await work;
      toast.success(success);
      return true;
    } catch (error) {
      toast.error((error as Error).message, { id: ERROR_TOAST_ID });
      return false;
    }
  };

  const buildDictionary = (
    assigned: NamedRef[],
    entries: DictionaryEntry[] | undefined,
    createEntry: (name: string) => Promise<DictionaryEntry>,
    replace: (ids: string[]) => Promise<unknown>,
    successMessage: string,
  ): ChipDictionary => {
    const ids = assigned.map((entry) => entry.id);
    const idOf = (name: string) =>
      (entries ?? []).find((entry) => entry.name === name)?.id;

    return {
      values: assigned.map((entry) => entry.name),
      options: optionNames(entries, assigned),
      add: (name) => {
        const id = idOf(name);
        if (!id || ids.includes(id)) return;
        void run(replace([...ids, id]), successMessage);
      },
   
      remove: (name) => {
        const id = idOf(name);
        if (!id) return;
        void run(
          replace(ids.filter((entry) => entry !== id)),
          successMessage,
        );
      },
     
      create: (name) =>
        void run(
          createEntry(name).then((created) => replace([...ids, created.id])),
          successMessage,
        ),
    };
  };

  const createStatus = async (
    statusName: string,
    color: StatusColorId,
  ): Promise<CreateStatusResult> => {
    const trimmed = statusName.trim();

    try {
      const created = await createStatusEntry.mutateAsync({
        name: trimmed,
        color,
      });
      await setProjectStatus.mutateAsync(created.id);
      toast.success(`Status „${trimmed}” został dodany`);
      return { ok: true };
    } catch (error) {

      if ((error as { status?: number }).status === 409) {
        return { ok: false, reason: 'duplicate' };
      }
      const message = (error as Error).message;
      toast.error(message, { id: ERROR_TOAST_ID });
      return { ok: false };
    }
  };

  const deleteStatus = async (id: string): Promise<DeleteStatusResult> => {
    try {
      await deleteStatusEntry.mutateAsync(id);
      return { ok: true, usage: 0 };
    } catch (error) {
      const { status, message } = error as Error & { status?: number };
      if (status === 409) {
        return { ok: false, usage: usageFromMessage(message) };
      }
      toast.error(message, { id: ERROR_TOAST_ID });
      return { ok: false, usage: 0 };
    }
  };

  return {
    name: project.name,
    description: project.description,
    status: project.status,
    statuses: statuses.data ?? [],
    typeDictionary: buildDictionary(
      project.types,
      types.data,
      (name) => createTypeEntry.mutateAsync({ name }),
      (ids) => setProjectTypes.mutateAsync(ids),
      'Typy projektu zaktualizowane',
    ),
    audienceDictionary: buildDictionary(
      project.recipients,
      recipients.data,
      (name) => createRecipientEntry.mutateAsync({ name }),
      (ids) => setProjectRecipients.mutateAsync(ids),
      'Odbiorcy projektu zaktualizowani',
    ),
  
    updateHeader: (next: { name: string; description: string }) =>
      run(updateProject.mutateAsync(next), 'Projekt zaktualizowany'),
    setStatus: (id: string) =>
      void run(
        setProjectStatus.mutateAsync(id),
        'Status projektu zaktualizowany',
      ),
    createStatus,
    renameStatus: (id: string, next: string) =>
      void run(
        updateStatusEntry.mutateAsync({ id, name: next.trim() }),
        'Nazwa statusu zaktualizowana',
      ),
    recolorStatus: (id: string, color: StatusColorId) =>
      void run(
        updateStatusEntry.mutateAsync({ id, color }),
        'Kolor statusu zaktualizowany',
      ),
    deleteStatus,
  };
}
