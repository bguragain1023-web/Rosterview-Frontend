import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import type { Value } from "react-calendar/dist/shared/types.js";

interface CoordinatorCalenderProps {
  selectedDate: Value;
  onDateChange: (value: Value) => void;
}

export const CoordinatorCalender = ({
  selectedDate,
  onDateChange,
}: CoordinatorCalenderProps) => {
  return <Calendar value={selectedDate} onChange={onDateChange} />;
};
