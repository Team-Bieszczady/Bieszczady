import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { PERSON_FORMS, pluralizePl } from '../../../lib/pluralizePl';
import { todayIso } from '../../projects/utils/isoDate';
import { downloadCsv, safeFileNamePart } from '../csv';
import { toProjectParticipantsCsv } from '../projectParticipantsCsv';

const EXPORT_TOAST_ID = 'project-participants-export';

export function useProjectParticipantsExport() {
  const { requireToken } = useAuthToken();
  const [isExporting, setIsExporting] = useState(false);

  const exportProject = async (projectId: string) => {
    setIsExporting(true);

    try {
      const data = await api.getProjectParticipants(requireToken(), projectId);

      if (data.participants.length === 0) {
        toast.error(
          `Nikt z bazy nie był jeszcze na spotkaniu w projekcie „${data.projectName}”`,
          { id: EXPORT_TOAST_ID },
        );
        return;
      }

      const fileName = `uczestnicy-${safeFileNamePart(data.projectName)}-${todayIso()}.csv`;
      downloadCsv(toProjectParticipantsCsv(data.participants), fileName);

      const people = pluralizePl(data.participants.length, PERSON_FORMS);
      toast.success(
        `Pobrano listę: ${people} z projektu „${data.projectName}”`,
        { id: EXPORT_TOAST_ID },
      );
    } catch (error) {
      toast.error((error as Error).message, { id: EXPORT_TOAST_ID });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportProject, isExporting };
}
