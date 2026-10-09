import type { MeetingStatus } from '../../../lib/api';
import type { Meeting } from '../types';

const STATUS_DESCRIPTIONS: Record<MeetingStatus, string> = {
  PLANNED: '',
  HELD: ', odbyło się',
  CANCELLED: ', odwołane',
};

export function describeMeeting(meeting: Meeting) {
  return `${meeting.title}, ${meeting.startTime}–${meeting.endTime}${STATUS_DESCRIPTIONS[meeting.status]}`;
}
