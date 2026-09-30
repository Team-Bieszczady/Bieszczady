import { addDaysIso, endOfMonthIso, endOfWeekIso, startOfMonthIso, startOfWeekIso } from "../../projects/utils/isoDate";

export const getMonthGridDays = (date: string) => {

const monthDays: string[] = []
const firstDay = startOfWeekIso( startOfMonthIso(date));
const lastDay = endOfWeekIso(endOfMonthIso(date));
let i = 0;
let current = firstDay;
while(current <= lastDay){
    monthDays[i] = current;
    current = addDaysIso(current, 1);
    i++;
}
return monthDays
}