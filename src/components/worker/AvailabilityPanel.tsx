import { useEffect, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  addAvailability,
  deleteAvailability,
  getMyAvailability,
  updateAvailabilityStatus,
  type IAvailability,
} from "../../helper/axios";
import { toDateInputValue } from "../../utils/dates";

// dayOfWeek uses 0 = Sunday … 6 = Saturday (same as the backend).
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
// Shown Monday first.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

// Specific dates are stored as UTC midnight, so read them in UTC.
const formatSpecificDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AU", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

interface AvailabilityPanelProps {
  onChanged: () => void; // e.g. refresh the calendar's dots
}

export const AvailabilityPanel = ({ onChanged }: AvailabilityPanelProps) => {
  const [entries, setEntries] = useState<IAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  // Which button is waiting for the server ("day-1", an entry id, or "add")
  const [busy, setBusy] = useState<string | null>(null);

  const [newDate, setNewDate] = useState("");
  const [newStatus, setNewStatus] =
    useState<IAvailability["status"]>("unavailable");

  const todayKey = toDateInputValue(new Date());

  useEffect(() => {
    let ignore = false;

    getMyAvailability().then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setEntries(res.availability);
      } else {
        toast.error(res.message);
      }
      setIsLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const afterChange = () => {
    setReloadKey((k) => k + 1);
    onChanged();
  };

  const recurringFor = (day: number) =>
    entries.find((e) => e.type === "recurring" && e.dayOfWeek === day);

  // No entry means available.
  const isDayAvailable = (day: number) =>
    recurringFor(day)?.status !== "unavailable";

  const toggleDay = async (day: number) => {
    const entry = recurringFor(day);
    const makeUnavailable = isDayAvailable(day);

    setBusy(`day-${day}`);
    const res = !entry
      ? await addAvailability({
          type: "recurring",
          dayOfWeek: day,
          status: "unavailable",
        })
      : entry.status === "unavailable"
        ? await deleteAvailability(entry._id) // back to the default (available)
        : await updateAvailabilityStatus(entry._id, "unavailable");
    setBusy(null);

    if (res.status !== "success") {
      toast.error(res.message);
      return;
    }
    toast.success(
      `${WEEKDAYS[day]}s set to ${makeUnavailable ? "unavailable" : "available"}`,
    );
    afterChange();
  };

  const specificDates = entries
    .filter(
      (e) => e.type === "specific" && e.date && e.date.slice(0, 10) >= todayKey,
    )
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

  const handleAdd = async () => {
    if (!newDate) {
      toast.error("Please pick a date");
      return;
    }
    if (newDate < todayKey) {
      toast.error("Pick today or a later date");
      return;
    }

    setBusy("add");
    const res = await addAvailability({
      type: "specific",
      date: newDate,
      status: newStatus,
    });
    setBusy(null);

    if (res.status !== "success") {
      toast.error(res.message); // e.g. that date already has an entry
      return;
    }
    toast.success("Date added");
    setNewDate("");
    setNewStatus("unavailable");
    afterChange();
  };

  const handleRemove = async (entry: IAvailability) => {
    setBusy(entry._id);
    const res = await deleteAvailability(entry._id);
    setBusy(null);

    if (res.status !== "success") {
      toast.error(res.message);
      return;
    }
    toast.success("Date removed");
    afterChange();
  };

  if (isLoading) {
    return (
      <div className="text-center my-3">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }

  return (
    <>
      <div className="teamMembersTitle mt-0 pt-0 border-0">WEEKLY</div>
      <p className="mutedDate mb-2">
        Days you can't usually work. Click a day to switch it.
      </p>
      <div className="d-flex flex-wrap gap-2 mb-1">
        {WEEK_ORDER.map((day) => {
          const available = isDayAvailable(day);
          return (
            <button
              key={day}
              type="button"
              className={`weekDayToggle ${available ? "available" : "unavailable"}`}
              onClick={() => toggleDay(day)}
              disabled={busy !== null}
              title={`${WEEKDAYS[day]}: ${available ? "available" : "unavailable"} (click to switch)`}
            >
              {WEEKDAYS[day].slice(0, 3)} {available ? "✓" : "✗"}
            </button>
          );
        })}
      </div>
      <p className="mutedDate small">green = available · red = unavailable</p>

      <div className="teamMembersTitle">SPECIFIC DATES</div>
      <p className="mutedDate mb-2">Overrides the weekly setting for one day.</p>

      {specificDates.length === 0 ? (
        <p className="mutedDate">No upcoming dates.</p>
      ) : (
        <ul className="teamMembers manageMembers mb-3">
          {specificDates.map((e) => {
            const weekday = new Date(e.date as string).getUTCDay();
            const overridesWeekly =
              e.status === "available" && !isDayAvailable(weekday);
            return (
              <li key={e._id}>
                <span className="memberName">
                  {formatSpecificDate(e.date as string)}
                </span>
                <span
                  className={
                    e.status === "unavailable" ? "calDayReason" : "text-success"
                  }
                >
                  {e.status === "unavailable" ? "Unavailable" : "Available"}
                  {overridesWeekly && (
                    <span className="mutedDate">
                      {" "}
                      (overrides {WEEKDAYS[weekday]})
                    </span>
                  )}
                </span>
                <Button
                  size="sm"
                  variant="outline-danger"
                  className="memberAction"
                  onClick={() => handleRemove(e)}
                  disabled={busy !== null}
                >
                  {busy === e._id ? "Removing..." : "Remove"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="d-flex flex-wrap gap-2 align-items-center">
        <Form.Control
          type="date"
          value={newDate}
          min={todayKey}
          onChange={(e) => setNewDate(e.target.value)}
          aria-label="Date"
          style={{ maxWidth: 180 }}
        />
        <Form.Select
          value={newStatus}
          onChange={(e) =>
            setNewStatus(e.target.value as IAvailability["status"])
          }
          aria-label="Status for this date"
          style={{ maxWidth: 160 }}
        >
          <option value="unavailable">Unavailable</option>
          <option value="available">Available</option>
        </Form.Select>
        <Button onClick={handleAdd} disabled={busy !== null}>
          {busy === "add" ? "Adding..." : "Add"}
        </Button>
      </div>

      <p className="mutedDate small mt-3 mb-0">
        ⓘ Changing availability doesn't remove shifts you're already rostered
        on. Talk to your coordinator about those.
      </p>
    </>
  );
};
