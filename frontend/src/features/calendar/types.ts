import type { BackendDeadline, MeetingStatus } from '../../lib/api';

export interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  projectId: string;
  place: string | null;
  status: MeetingStatus;
}

export interface Deadline extends Omit<BackendDeadline, 'dueDate'> {
  date: string;
}

export interface CalendarProject {
  id: string;
  name: string;
  color: string;
}
