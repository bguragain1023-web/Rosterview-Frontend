import type { ILeaveRequest, LeaveType } from "../helper/axios";
import { formatShiftDate } from "./dates";

const DAY_MS = 24 * 60 * 60 * 1000;

export const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: "annual", label: "Annual" },
  { value: "personal", label: "Personal" },
  { value: "sick", label: "Sick" },
  { value: "unpaid", label: "Unpaid" },
  { value: "other", label: "Other" },
];

// Number of days between two "YYYY-MM-DD" (or ISO) dates, counting both ends.
export const daysBetween = (start: string, end: string) =>
  Math.round((Date.parse(end) - Date.parse(start)) / DAY_MS) + 1;

// Leave dates are stored as UTC midnight; both ends are inclusive.
export const leaveDays = (leave: ILeaveRequest) =>
  daysBetween(leave.startDate, leave.endDate);

// "Fri 14 Nov" or "Fri 14 Nov – Sun 16 Nov"
export const leaveRange = (leave: ILeaveRequest) =>
  leave.startDate === leave.endDate
    ? formatShiftDate(leave.startDate)
    : `${formatShiftDate(leave.startDate)} – ${formatShiftDate(leave.endDate)}`;

export const plural = (n: number, word: string) =>
  `${n} ${word}${n === 1 ? "" : "s"}`;

// e.g. "4 Nov"
export const formatShortDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
