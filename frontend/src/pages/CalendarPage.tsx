import { useState } from 'react';
import toast from 'react-hot-toast';
import { LuChevronLeft, LuChevronRight, LuPlus } from 'react-icons/lu';
import {
  formatViewTitle,
  shiftAnchor,
  visibleDays,
  type CalendarView,
} from '../features/calendar/utils/calendarView';
import { todayIso } from '../features/projects/utils/isoDate';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { MonthView } from '../features/calendar/components/MonthView';
import { TimeGridView } from '../features/calendar/components/time-grid/TimeGridView';
import { ViewSwitcher } from '../features/calendar/components/ViewSwitcher';
import { ProjectFilter } from '../features/calendar/components/ProjectFilter';
import MeetingFormModal, {
  type MeetingFormInputs,
} from '../features/calendar/components/MeetingFormModal';
import MeetingDetailsModal from '../features/calendar/components/MeetingDetailsModal';
import { useMeetings } from '../features/calendar/hooks/useMeetings';
import { useCreateMeeting } from '../features/calendar/hooks/useCreateMeeting';
import { useUpdateMeeting } from '../features/calendar/hooks/useUpdateMeeting';
import { useDeleteMeeting } from '../features/calendar/hooks/useDeleteMeeting';
import { useMeetingProjectOptions } from '../features/calendar/hooks/useMeetingProjectOptions';
import { useProjects } from '../features/projects/hooks/useProjectsApi';
import type { BackendMeetingDetails, MeetingChanges } from '../lib/api';

const PREVIOUS_LABELS: Record<CalendarView, string> = {
  day: 'Poprzedni dzień',
  week: 'Poprzedni tydzień',
  month: 'Poprzedni miesiąc',
};

const NEXT_LABELS: Record<CalendarView, string> = {
  day: 'Następny dzień',
  week: 'Następny tydzień',
  month: 'Następny miesiąc',
};

const NAV_BUTTON_CLASSES =
  'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50';

function toMeetingChanges(values: MeetingFormInputs): MeetingChanges {
  return {
    title: values.title,
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
    place: values.place || undefined,
    meetingUrl: values.meetingUrl || undefined,
    note: values.note || undefined,
    inviteeIds: values.inviteeIds,
  };
}

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>('month');
  const [anchor, setAnchor] = useState(todayIso);
  const [hiddenProjectIds, setHiddenProjectIds] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editedMeeting, setEditedMeeting] =
    useState<BackendMeetingDetails | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null,
  );
  const [meetingToDelete, setMeetingToDelete] =
    useState<BackendMeetingDetails | null>(null);

  const toggleProject = (id: string) => {
    if (hiddenProjectIds.includes(id)) {
      setHiddenProjectIds((prev) => prev.filter((el) => el !== id));
    } else {
      setHiddenProjectIds((prev) => [...prev, id]);
    }
  };

  const days = visibleDays(view, anchor);
  const meetingsQuery = useMeetings(days[0], days[days.length - 1]);
  const projectsQuery = useProjects();
  const projectOptionsQuery = useMeetingProjectOptions();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();

  const meetings = meetingsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];

  const filteredMeetings = meetings.filter(
    (meeting) => !hiddenProjectIds.includes(meeting.projectId),
  );

  const projectOptions = (projectOptionsQuery.data ?? []).map((project) => ({
    value: project.id,
    label: project.name,
  }));
  const canAddMeetings = projectOptions.length > 0;

  const openDay = (day: string) => {
    setView('day');
    setAnchor(day);
  };

  const openAddForm = () => {
    setEditedMeeting(null);
    setIsFormOpen(true);
  };

  const openEditForm = (meeting: BackendMeetingDetails) => {
    setSelectedMeetingId(null);
    setEditedMeeting(meeting);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditedMeeting(null);
  };

  const afterSave = (message: string) => ({
    onSuccess: () => {
      closeForm();
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const submitMeeting = (values: MeetingFormInputs) => {
    if (editedMeeting) {
      updateMeeting.mutate(
        { id: editedMeeting.id, changes: toMeetingChanges(values) },
        afterSave('Zmiany zapisane'),
      );
      return;
    }

    createMeeting.mutate(
      { projectId: values.projectId, ...toMeetingChanges(values) },
      afterSave('Spotkanie dodane'),
    );
  };

  const askToDelete = (meeting: BackendMeetingDetails) => {
    setSelectedMeetingId(null);
    setMeetingToDelete(meeting);
  };

  const cancelDelete = () => {
    if (meetingToDelete) setSelectedMeetingId(meetingToDelete.id);
    setMeetingToDelete(null);
  };

  const confirmDelete = () => {
    if (!meetingToDelete) return;

    deleteMeeting.mutate(meetingToDelete.id, {
      onSuccess: () => {
        setMeetingToDelete(null);
        toast.success('Spotkanie usunięte');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-16 pb-4 min-[400px]:px-6 sm:px-8 lg:pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-dark min-[500px]:text-xl lg:text-2xl">
          Kalendarz
        </h1>
        {canAddMeetings && (
          <Button
            variant="primary"
            size="small"
            type="button"
            onClick={openAddForm}
            className="gap-1.5"
          >
            <LuPlus size={16} aria-hidden="true" />
            Dodaj spotkanie
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={PREVIOUS_LABELS[view]}
              onClick={() => setAnchor((prev) => shiftAnchor(view, prev, -1))}
              className={NAV_BUTTON_CLASSES}
            >
              <LuChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => setAnchor(todayIso())}
              className="h-8 cursor-pointer rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium hover:bg-gray-50"
            >
              Dzisiaj
            </button>

            <button
              type="button"
              aria-label={NEXT_LABELS[view]}
              onClick={() => setAnchor((prev) => shiftAnchor(view, prev, 1))}
              className={NAV_BUTTON_CLASSES}
            >
              <LuChevronRight size={16} />
            </button>

            <p className="text-lg font-bold text-dark sm:text-xl">
              {formatViewTitle(view, anchor)}
            </p>
          </div>

          <ViewSwitcher value={view} onChange={setView} />
        </div>
        <ProjectFilter
          projects={projects}
          hiddenProjectIds={hiddenProjectIds}
          onToggle={toggleProject}
        />
      </div>

      {meetingsQuery.isError && (
        <div role="alert" className="flex items-center gap-3">
          <p className="text-xs text-darkRed">Nie udało się pobrać spotkań.</p>
          <button
            type="button"
            onClick={() => meetingsQuery.refetch()}
            className="cursor-pointer text-xs font-medium text-darkGreen hover:text-darkGreenHover"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}

      {view === 'month' ? (
        <MonthView
          anchor={anchor}
          meetings={filteredMeetings}
          projects={projects}
          onMeetingClick={setSelectedMeetingId}
          onDayClick={openDay}
        />
      ) : (
        <TimeGridView
          days={days}
          meetings={filteredMeetings}
          projects={projects}
          onMeetingClick={setSelectedMeetingId}
          onDayClick={openDay}
        />
      )}

      {selectedMeetingId && (
        <MeetingDetailsModal
          meetingId={selectedMeetingId}
          onClose={() => setSelectedMeetingId(null)}
          onEdit={openEditForm}
          onDelete={askToDelete}
        />
      )}

      <ConfirmDialog
        isOpen={meetingToDelete !== null}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Usuń spotkanie"
        description={`Czy na pewno chcesz usunąć spotkanie „${meetingToDelete?.title ?? ''}”? Zniknie z kalendarza wszystkich uczestników.`}
        confirmLabel="Usuń"
        tone="danger"
        isPending={deleteMeeting.isPending}
      />

      {isFormOpen && (
        <MeetingFormModal
          meeting={editedMeeting ?? undefined}
          projectOptions={projectOptions}
          onClose={closeForm}
          onSubmit={submitMeeting}
          isPending={createMeeting.isPending || updateMeeting.isPending}
        />
      )}
    </div>
  );
}
