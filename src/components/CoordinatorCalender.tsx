import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import type { Value } from "react-calendar/dist/shared/types.js";

export const CoordinatorCalender = () => {
  const [selectDate, setSelectDate] = useState<Value>(new Date());

  const handleOnDateClick = (value: Value) => {
    setSelectDate(value);
    console.log("clicked Date ", value);
  };
  return <Calendar value={selectDate} onChange={handleOnDateClick} />;
};
