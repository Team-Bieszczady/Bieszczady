import { useState } from "react";
import { getMonthGridDays } from "../features/calendar/utils/monthGrid";
import { addDaysIso, startOfMonthIso, startOfWeekIso, todayIso } from "../features/projects/utils/isoDate";

export default function CalendarPage() {

  const [anchor, setAnchor] = useState(todayIso)

  console.log(getMonthGridDays('2026-09-15'));




  return (
    <div>
      <button
        onClick={() => setAnchor((prev) => addDaysIso(startOfMonthIso(prev), ))}
      ></button>
      <p>{anchor}</p>
      CalendarPage
    </div>
  );
}
