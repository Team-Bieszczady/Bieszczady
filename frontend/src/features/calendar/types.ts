import type { MeetingStatus } from '../../lib/api';

export interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  projectId: string;
  status: MeetingStatus;
}
export interface CalendarProject {
  id: string;
  name: string;
  color: string;
}
