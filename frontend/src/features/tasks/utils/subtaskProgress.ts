import type { Subtask } from '../../projects/types';

export interface SubtaskProgress {
  done: number;
  total: number;
  percent: number;
}

export function subtaskProgress(subtasks: Subtask[]): SubtaskProgress {
  const total = subtasks.length;
  const done = subtasks.filter((subtask) => subtask.done).length;

  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}
