import { useEffect, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { getShifts, type IShift } from "../../helper/axios";
import { DataTable, type Column } from "../custom/DataTable";
import {
  addDays,
  formatShiftDate,
  startOfWeek,
  toDateInputValue,
} from "../../utils/dates";

const formatWeekRange = (start: Date, end: Date) => {
  const short = { weekday: "short", day: "numeric", month: "short" } as const;
  return `${start.toLocaleDateString("en-AU", short)} – ${end.toLocaleDateString("en-AU", { ...short, year: "numeric" })}`;
};

const columns: Column<IShift>[] = [
  { header: "Date", render: (s) => formatShiftDate(s.date) },
  {
    header: "Time",
    render: (s) => (
      <>
        {s.startTime}–{s.endTime}
        {s.endTime < s.startTime && (
          <span className="mutedDate" title="Overnight">
            {" "}
            ☾
          </span>
        )}
      </>
    ),
  },
  { header: "Hours", render: (s) => s.totalHours },
  { header: "Worker", render: (s) => s.workerName ?? "Unknown" },
  { header: "Client", render: (s) => s.clientName ?? "Unknown" },
  { header: "Location", render: (s) => s.location },
  {
    header: "Status",
    render: (s) => (
      <span className={`shiftStatus ${s.status}`}>{s.status}</span>
    ),
  },
];

// Read-only: team leaders can view their team's shifts but not change them.
export const TeamRosterPanel = () => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [shifts, setShifts] = useState<IShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const weekEnd = addDays(weekStart, 6);
  const from = toDateInputValue(weekStart);
  const to = toDateInputValue(weekEnd);

  useEffect(() => {
    let ignore = false;

    getShifts({ from, to }).then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setShifts(
          [...res.allShifts].sort(
            (a, b) =>
              a.date.localeCompare(b.date) ||
              a.startTime.localeCompare(b.startTime),
          ),
        );
      } else {
        toast.error(res.message);
      }
      setIsLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [from, to]);

  const changeWeek = (newStart: Date) => {
    setIsLoading(true);
    setWeekStart(newStart);
  };

  const activeShifts = shifts.filter((s) => s.status !== "cancelled");
  const totalHours = activeShifts.reduce((sum, s) => sum + s.totalHours, 0);

  return (
    <>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <Button
          size="sm"
          variant="outline-light"
          onClick={() => changeWeek(addDays(weekStart, -7))}
          aria-label="Previous week"
        >
          ◀
        </Button>
        <span className="px-2">{formatWeekRange(weekStart, weekEnd)}</span>
        <Button
          size="sm"
          variant="outline-light"
          onClick={() => changeWeek(addDays(weekStart, 7))}
          aria-label="Next week"
        >
          ▶
        </Button>
        <Button
          size="sm"
          variant="outline-light"
          onClick={() => changeWeek(startOfWeek(new Date()))}
        >
          This week
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
        </div>
      ) : shifts.length === 0 ? (
        <p className="mutedDate text-center my-5">No team shifts this week.</p>
      ) : (
        <>
          {/* key resets to page 1 when the week changes */}
          <div key={from}>
            <DataTable
              columns={columns}
              rows={shifts}
              getKey={(s) => s._id}
              getRowClassName={(s) =>
                s.status === "cancelled" ? "cancelledRow" : undefined
              }
            />
          </div>
          <p className="mutedDate mt-2">
            {activeShifts.length} shifts · {Number(totalHours.toFixed(2))} h
            rostered
          </p>
        </>
      )}
    </>
  );
};
