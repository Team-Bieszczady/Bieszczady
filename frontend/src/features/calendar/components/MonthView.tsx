import { endOfMonthIso, startOfMonthIso, todayIso } from "../../projects/utils/isoDate";
import { dayNumber, getMonthGridDays } from "../utils/monthGrid";

const weekDays = ['PN', 'WT', 'ŚR', 'CZ', 'PT', 'SO', 'ND'];

export function MonthView({ anchor }: { anchor: string }) {


const daysMonth = getMonthGridDays(anchor);

const firstDay = startOfMonthIso(anchor);
const lastDay = endOfMonthIso(anchor);
  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
      {weekDays.map((day) => (
        <div
          key={day}
          className="bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-400"
        >
          {day}
        </div>
      ))}

      {daysMonth.map((day) => (
        <div
          key={day}
          className={`h-28 p-2 text-sm
            ${(day < firstDay || day > lastDay
              ? 'bg-gray-50 text-gray-400'
              : 'bg-white text-dark')
            }`}
        >
          <span
            className={`inline-flex items-center justify-center h-7 w-7 rounded-full 
                ${
                  day === todayIso()
                    ? 'bg-darkGreen font-semibold text-white' : ''
                }`}
          >
            {dayNumber(day)}
          </span>
        </div>
      ))}
    </div>
  );
}
