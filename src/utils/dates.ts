// Local calendar date -> "YYYY-MM-DD" (for <input type="date"> and API queries).
export const toDateInputValue = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Monday of the week containing `date` (weeks run Monday–Sunday, like the
// backend's weekly-hours calculation).
export const startOfWeek = (date: Date) => {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = day.getDay();
  return addDays(day, weekday === 0 ? -6 : 1 - weekday);
};

// Shift dates are stored as UTC midnight, so show them in UTC; otherwise a
// browser behind UTC would show the previous day.
export const formatShiftDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("en-AU", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
