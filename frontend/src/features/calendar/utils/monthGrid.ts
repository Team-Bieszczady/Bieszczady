import { addDaysIso, endOfMonthIso, endOfWeekIso, startOfMonthIso, startOfWeekIso } from "../../projects/utils/isoDate";

export const getMonthGridDays = (date: string) => {

const monthDays: string[] = [];
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

export const formatMonthTitle = (date: string) => {
 const year = date.slice(0,4);
 const month = date.slice(5,7);

 const monthName = new Date(
   Number(year),
   Number(month) - 1,
   1,
 ).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
 const title = `${monthName[0].toUpperCase()}${monthName.slice(1)}`;
return title; 

}
  export const dayNumber = (date: string) => {
      const day = date.slice(-2);
      if (day[0] === '0') {
        return day[1];
      } else {
        return day;
      }
    };