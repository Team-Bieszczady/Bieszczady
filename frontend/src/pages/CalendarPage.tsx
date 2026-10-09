import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuPlus } from 'react-icons/lu';
import { useSearchParams } from 'react-router';
import {
  shiftAnchor,
  visibleDays,
  type CalendarView,
} from '../features/calendar/utils/calendarView';
import { todayIso } from '../features/projects/utils/isoDate';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useAuth } from '../context/useAuth';
import { hasModule } from '../lib/modules';
import { CalendarToolbar } from '../features/calendar/components/CalendarToolbar';
import { MonthView } from '../features/calendar/components/MonthView';
import { WeekAgenda } from '../features/calendar/components/WeekAgenda';
import { TimeGridView } from '../features/calendar/components/time-grid/TimeGridView';
import { ProjectFilter } from '../features/calendar/components/ProjectFilter';
import MeetingFormModal, {
  type MeetingFormInputs,
} from '../features/calendar/components/MeetingFormModal';
import MeetingDetailsModal from '../features/calendar/components/MeetingDetailsModal';
import DeadlineDetailsModal from '../features/calendar/components/DeadlineDetailsModal';
import { useMeetings } from '../features/calendar/hooks/useMeetings';
import { useDeadlines } from '../features/calendar/hooks/useDeadlines';
import { useCreateMeeting } from '../features/calendar/hooks/useCreateMeeting';
import { useUpdateMeeting } from '../features/calendar/hooks/useUpdateMeeting';
import { useDeleteMeeting } from '../features/calendar/hooks/useDeleteMeeting';
import { useMeetingProjectOptions } from '../features/calendar/hooks/useMeetingProjectOptions';
import { useProjects } from '../features/projects/hooks/useProjectsApi';
import type { Deadline } from '../features/calendar/types';
import type { BackendMeetingDetails, MeetingChanges } from '../lib/api';

function toMeetingChanges(values: MeetingFormInputs): MeetingChanges {
  return {
    title: values.title,
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
    place: values.place || undefined,
    meetingUrl: values.meetingUrl.trim() || undefined,
    note: values.note || undefined,
    inviteeIds: values.inviteeIds,
  };
}

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>('month');
  const [anchor, setAnchor] = useState(todayIso);
  const [hiddenProjectIds, setHiddenProjectIds] = useState<string[]>([]);
  const [showMeetings, setShowMeetings] = useState(true);
  const [showDeadlines, setShowDeadlines] = useState(true);
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editedMeeting, setEditedMeeting] =
    useState<BackendMeetingDetails | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    () => searchParams.get('meeting'),
  );

  useEffect(() => {
    setSearchParams(
      (params) => {
        if (!params.has('meeting')) {
          return params;
        }

        params.delete('meeting');
        return params;
      },
      { replace: true },
    );
  }, [setSearchParams]);
  const [meetingToDelete, setMeetingToDelete] =
    useState<BackendMeetingDetails | null>(null);
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(
    null,
  );
  const isPhone = !useMediaQuery('(min-width: 640px)');

  const toggleProject = (id: string) => {
    if (hiddenProjectIds.includes(id)) {
      setHiddenProjectIds((prev) => prev.filter((el) => el !== id));
    } else {
      setHiddenProjectIds((prev) => [...prev, id]);
    }
  };

  const days = visibleDays(view, anchor);
  const meetingsQuery = useMeetings(days[0], days[days.length - 1]);
  const deadlinesQuery = useDeadlines(days[0], days[days.length - 1]);
  const projectsQuery = useProjects();
  const projectOptionsQuery = useMeetingProjectOptions();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();

  const meetings = meetingsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];

  const filteredMeetings = meetings.filter(
    (meeting) => showMeetings && !hiddenProjectIds.includes(meeting.projectId),
  );
  const filteredDeadlines = (deadlinesQuery.data ?? []).filter(
    (deadline) =>
      showDeadlines && !hiddenProjectIds.includes(deadline.projectId),
  );
  const loadFailed = meetingsQuery.isError || deadlinesQuery.isError;
  const showAgenda = isPhone && view === 'week';

  const retryLoading = () => {
    if (meetingsQuery.isError) void meetingsQuery.refetch();
    if (deadlinesQuery.isError) void deadlinesQuery.refetch();
  };

  const projectOptions = (projectOptionsQuery.data ?? []).map((project) => ({
    value: project.id,
    label: project.name,
  }));
  const canAddMeetings = projectOptions.length > 0;

  const openDay = (day: string) => {
    setView('day');
    setAnchor(day);
  };

  const entryProps = {
    meetings: filteredMeetings,
    deadlines: filteredDeadlines,
    projects,
    onMeetingClick: setSelectedMeetingId,
    onDeadlineClick: setSelectedDeadline,
    onDayClick: openDay,
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
        <CalendarToolbar
          view={view}
          anchor={anchor}
          compact={isPhone}
          onShift={(step) => setAnchor((prev) => shiftAnchor(view, prev, step))}
          onToday={() => setAnchor(todayIso())}
          onViewChange={setView}
        />
        <ProjectFilter
          projects={projects}
          hiddenProjectIds={hiddenProjectIds}
          onToggle={toggleProject}
          meetingsShown={showMeetings}
          onToggleMeetings={() => setShowMeetings((prev) => !prev)}
          showDeadlineToggle={hasModule(user, 'TASKS')}
          deadlinesShown={showDeadlines}
          onToggleDeadlines={() => setShowDeadlines((prev) => !prev)}
        />
      </div>

      {loadFailed && (
        <div role="alert" className="flex items-center gap-3">
          <p className="text-xs text-darkRed">
            {meetingsQuery.isError
              ? 'Nie udało się pobrać spotkań.'
              : 'Nie udało się pobrać terminów.'}
          </p>
          <button
            type="button"
            onClick={retryLoading}
            className="cursor-pointer text-xs font-medium text-darkGreen hover:text-darkGreenHover"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}

      {view === 'month' && (
        <MonthView anchor={anchor} compact={isPhone} {...entryProps} />
      )}
      {view !== 'month' && showAgenda && (
        <WeekAgenda days={days} {...entryProps} />
      )}
      {view !== 'month' && !showAgenda && (
        <TimeGridView days={days} {...entryProps} />
      )}

      {selectedDeadline && (
        <DeadlineDetailsModal
          deadline={selectedDeadline}
          onClose={() => setSelectedDeadline(null)}
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
