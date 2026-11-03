import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Col, Row, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  getLeaveRequests,
  getMyAvailability,
  getShifts,
  type IAvailability,
  type ILeaveRequest,
  type IShift,
} from "../../helper/axios";
import { toDateInputValue } from "../../utils/dates";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

// A shift that means the worker is working (cancelled ones don't count).
const isWorking = (s: IShift) =>
  s.status === "assigned" || s.status === "completed";

export const RosterCalendar = () => {
  const today = new Date();
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [selectedDay, setSelectedDay] = useState(today);

  const [shifts, setShifts] = useState<IShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availability, setAvailability] = useState<IAvailability[]>([]);
  const [approvedLeave, setApprovedLeave] = useState<ILeaveRequest[]>([]);

  // Calendar days are local dates, shift/leave dates are UTC midnight. Compare
  // both as "YYYY-MM-DD" text so the timezone can't shift a day.
  const from = toDateInputValue(startOfMonth(month));
  const to = toDateInputValue(endOfMonth(month));

  // The shown month's shifts (backend returns only this worker's own).
  useEffect(() => {
    let ignore = false;

    getShifts({ from, to }).then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setShifts(res.allShifts);
      } else {
        setShifts([]);
        toast.error(res.message);
      }
      setIsLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [from, to]);

  // Availability and leave: small, so load once.
  useEffect(() => {
    let ignore = false;

    Promise.all([getMyAvailability(), getLeaveRequests()]).then(
      ([availRes, leaveRes]) => {
        if (ignore) return;
        if (availRes.status === "success") {
          setAvailability(availRes.availability);
        } else {
          toast.error(availRes.message);
        }
        if (leaveRes.status === "success") {
          setApprovedLeave(
            leaveRes.leaveRequests.filter((l) => l.status === "approved"),
          );
        } else {
          toast.error(leaveRes.message);
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, []);

  // day key -> that day's shifts, built once per load
  const shiftsByDay = new Map<string, IShift[]>();
  for (const s of shifts) {
    const key = s.date.slice(0, 10);
    shiftsByDay.set(key, [...(shiftsByDay.get(key) ?? []), s]);
  }

  // Why the worker can't work this day, or null. Same order as the backend:
  // approved leave, then a specific-date entry (which overrides the weekly
  // one), then the weekly recurring entry.
  const unavailableReason = (date: Date): string | null => {
    const key = toDateInputValue(date);

    const leave = approvedLeave.find(
      (l) => l.startDate.slice(0, 10) <= key && key <= l.endDate.slice(0, 10),
    );
    if (leave) return `On approved ${leave.type} leave`;

    const specific = availability.find(
      (a) => a.type === "specific" && a.date?.slice(0, 10) === key,
    );
    if (specific) {
      return specific.status === "unavailable"
        ? "Marked unavailable on this date"
        : null;
    }

    const recurring = availability.find(
      (a) => a.type === "recurring" && a.dayOfWeek === date.getDay(),
    );
    if (recurring?.status === "unavailable") {
      return `Unavailable every ${WEEKDAYS[date.getDay()]}`;
    }
    return null;
  };

  const renderDots = (date: Date) => {
    const working = (shiftsByDay.get(toDateInputValue(date)) ?? []).some(
      isWorking,
    );
    const unavailable = unavailableReason(date) !== null;
    return (
      <div className="calDots">
        {working && <span className="calDot shift" />}
        {unavailable && <span className="calDot unavailable" />}
        {!working && !unavailable && <span className="calDot free" />}
      </div>
    );
  };

  const handleMonthChange = (start: Date | null) => {
    if (!start) return;
    setIsLoading(true);
    setMonth(startOfMonth(start));
    // Keep the details panel on a day we have data for.
    setSelectedDay(sameMonth(start, today) ? today : startOfMonth(start));
  };

  const monthShifts = shifts.filter(isWorking);
  const monthHours = monthShifts.reduce((sum, s) => sum + s.totalHours, 0);

  const dayShifts = shiftsByDay.get(toDateInputValue(selectedDay)) ?? [];
  const dayReason = unavailableReason(selectedDay);

  const monthSummary = `${monthShifts.length} shift${monthShifts.length === 1 ? "" : "s"} · ${Number(monthHours.toFixed(2))} h this month`;

  return (
    <Row className="rosterCalendar g-4">
      {/* Left: calendar (stacks above the details on smaller screens) */}
      <Col lg={8}>
        <div className="d-flex justify-content-between align-items-baseline mb-2">
          <div className="subtitle">My roster</div>
          <span className="mutedDate">
            {isLoading ? <Spinner animation="border" size="sm" /> : monthSummary}
          </span>
        </div>

        <Calendar
          locale="en-AU"
          calendarType="iso8601" // weeks start on Monday
          value={selectedDay}
          onClickDay={setSelectedDay}
          activeStartDate={month}
          onActiveStartDateChange={({ activeStartDate }) =>
            handleMonthChange(activeStartDate)
          }
          showNeighboringMonth={false}
          minDetail="year"
          tileContent={({ date, view }) =>
            view === "month" ? renderDots(date) : null
          }
        />

        <div className="calLegend">
          <span>
            <span className="calDot shift" /> Shift
          </span>
          <span>
            <span className="calDot unavailable" /> Unavailable or on leave
          </span>
          <span>
            <span className="calDot free" /> No shift
          </span>
        </div>
      </Col>

      {/* Right: the clicked day's details */}
      <Col lg={4}>
        <div className="calDayDetails">
          <div className="fw-semibold mb-2">
            {selectedDay.toLocaleDateString("en-AU", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>

          {dayReason && <div className="calDayReason mb-2">{dayReason}</div>}

          {isLoading ? null : dayShifts.length === 0 ? (
            <div className="mutedDate">No shifts</div>
          ) : (
            dayShifts.map((s) => (
              <div
                key={s._id}
                className={`calShift ${s.status === "cancelled" ? "cancelledRow" : ""}`}
              >
                <div>
                  {s.startTime}–{s.endTime}
                  {s.endTime < s.startTime && (
                    <span className="mutedDate" title="Overnight">
                      {" "}
                      ☾
                    </span>
                  )}{" "}
                  · {s.totalHours} h
                </div>
                <div className="mutedDate">
                  {s.clientName ?? "Unknown client"} · {s.location}
                </div>
                <span
                  className={`shiftStatus ${s.status}`}
                  title={
                    s.cancelReason ? `Reason: ${s.cancelReason}` : undefined
                  }
                >
                  {s.status}
                </span>
              </div>
            ))
          )}
        </div>
      </Col>
    </Row>
  );
};
