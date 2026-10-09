import type { BackendMeetingDetails } from '../../../lib/api';
import { formatStageDate, toIsoDate } from '../../projects/utils/isoDate';
import { formatWeekday } from './calendarView';

const EMPTY_ROWS = 20;

const SHEET_STYLES = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 14mm 12mm; font-family: Arial, sans-serif; color: #1f2937; font-size: 11pt; }
  h1 { margin: 0 0 4mm; font-size: 18pt; }
  .details { margin: 0 0 5mm; line-height: 1.5; }
  .details b { display: inline-block; min-width: 32mm; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #6b7280; padding: 0 2mm; text-align: left; }
  th { background: #f3f4f6; font-size: 9.5pt; height: 9mm; }
  td { height: 8.5mm; }
  .number { width: 10mm; text-align: center; }
  .town { width: 34mm; }
  .consent { width: 22mm; text-align: center; }
  .signature { width: 48mm; }
  .box { display: inline-block; width: 4mm; height: 4mm; border: 1px solid #374151; }
  .consent-note { margin: 3mm 0 0; font-size: 8.5pt; color: #4b5563; line-height: 1.4; }
  .footer { display: flex; justify-content: space-between; margin-top: 10mm; font-size: 10pt; }
  .line { display: inline-block; width: 55mm; border-bottom: 1px solid #374151; }
`;

function escapeHtml(text: string) {
  return text
    .split('&')
    .join('&amp;')
    .split('<')
    .join('&lt;')
    .split('>')
    .join('&gt;')
    .split('"')
    .join('&quot;')
    .split("'")
    .join('&#39;');
}

function emptyRows() {
  let rows = '';

  for (let number = 1; number <= EMPTY_ROWS; number += 1) {
    rows += `<tr><td class="number">${number}</td><td></td><td class="town"></td><td class="consent"><span class="box"></span></td><td class="signature"></td></tr>`;
  }

  return rows;
}

export function attendanceSheetHtml(meeting: BackendMeetingDetails) {
  const meetingDay = toIsoDate(meeting.date);
  const day = `${formatStageDate(meetingDay)} (${formatWeekday(meetingDay)})`;
  const time = `${meeting.startTime} – ${meeting.endTime}`;

  let placeLine = '';
  if (meeting.place) {
    placeLine = `<b>Miejsce:</b> ${escapeHtml(meeting.place)}<br>`;
  }

  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<title>Lista obecności – ${escapeHtml(meeting.title)}</title>
<style>${SHEET_STYLES}</style>
</head>
<body>
<h1>Lista obecności</h1>
<p class="details">
<b>Spotkanie:</b> ${escapeHtml(meeting.title)}<br>
<b>Projekt:</b> ${escapeHtml(meeting.project.name)}<br>
<b>Data:</b> ${escapeHtml(day)}, ${escapeHtml(time)}<br>
${placeLine}<b>Organizator:</b> Bieszczadzki Uniwersytet Ludowy
</p>
<table>
<thead>
<tr><th class="number">Lp.</th><th>Imię i nazwisko</th><th class="town">Miejscowość</th><th class="consent">Zgoda na kontakt</th><th class="signature">Podpis</th></tr>
</thead>
<tbody>${emptyRows()}</tbody>
</table>
<p class="consent-note">Zaznaczenie pola „Zgoda na kontakt” oznacza zgodę na otrzymywanie od Bieszczadzkiego Uniwersytetu Ludowego informacji o wydarzeniach i newslettera. Zgodę można w każdej chwili wycofać.</p>
<div class="footer">
<span>Liczba obecnych: <span class="line"></span></span>
<span>Podpis prowadzącego: <span class="line"></span></span>
</div>
</body>
</html>`;
}

export function printAttendanceSheet(meeting: BackendMeetingDetails) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';

  frame.onload = () => {
    const frameWindow = frame.contentWindow;
    if (frameWindow) {
      frameWindow.focus();
      frameWindow.print();
    }
    setTimeout(() => frame.remove(), 1000);
  };

  frame.srcdoc = attendanceSheetHtml(meeting);
  document.body.appendChild(frame);
}
