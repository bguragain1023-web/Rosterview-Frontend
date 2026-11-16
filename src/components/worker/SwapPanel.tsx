import { useEffect, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  createSwapRequest,
  getEligibleSwapShifts,
  getShifts,
  type IShift,
} from "../../helper/axios";
import { addDays, formatShiftDate, toDateInputValue } from "../../utils/dates";

type View = "create" | "view";

// The backend only allows a swap date up to 15 days after my shift.
const MAX_SWAP_DAYS = 15;

// "Thu 20 Nov · 09:00–17:00 · Mary Smith"
const shiftLabel = (s: IShift) =>
  `${formatShiftDate(s.date)} · ${s.startTime}–${s.endTime} · ${s.clientName ?? "Unknown client"}`;

export const SwapPanel = () => {
  const [view, setView] = useState<View>("create");

  // My upcoming assigned shifts (for a worker, the backend only returns their own)
  const [myShifts, setMyShifts] = useState<IShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // The form
  const [myShiftId, setMyShiftId] = useState("");
  const [targetDate, setTargetDate] = useState(""); // "YYYY-MM-DD"
  // null = not searched yet, [] = searched but nothing found
  const [options, setOptions] = useState<IShift[] | null>(null);
  const [targetShiftId, setTargetShiftId] = useState("");
  const [isFinding, setIsFinding] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const todayKey = toDateInputValue(new Date());

  useEffect(() => {
    let ignore = false;

    getShifts({ from: todayKey }).then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setMyShifts(
          res.allShifts
            .filter((s) => s.status === "assigned")
            // earliest first
            .sort(
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
  }, [todayKey]);

  // Derived: the chosen shift, and the dates the backend will accept.
  const myShift = myShifts.find((s) => s._id === myShiftId);
  const minDate = myShift ? myShift.date.slice(0, 10) : "";
  const maxDate = myShift
    ? toDateInputValue(addDays(new Date(`${minDate}T00:00:00`), MAX_SWAP_DAYS))
    : "";

  // Changing the shift or the date makes old search results wrong.
  const clearResults = () => {
    setOptions(null);
    setTargetShiftId("");
  };

  const handleFind = async () => {
    setIsFinding(true);
    const res = await getEligibleSwapShifts(myShiftId, targetDate);
    setIsFinding(false);

    if (res.status === "success") {
      setOptions(res.result);
    } else {
      toast.error(res.message);
    }
  };

  const handleSend = async () => {
    setIsSending(true); // disables the button: no double send
    const res = await createSwapRequest(myShiftId, targetShiftId);
    setIsSending(false);

    toast[res.status](res.message); // e.g. "already pending"
    if (res.status === "success") {
      setMyShiftId("");
      setTargetDate("");
      clearResults();
    }
  };

  const renderOptions = () => {
    if (options === null) return null; // not searched yet
    if (options.length === 0) {
      return (
        <p className="mutedDate mt-2">
          No teammate shifts can swap on that day. Try another date.
        </p>
      );
    }
    return (
      <>
        <div className="teamMembersTitle">CHOOSE A SHIFT</div>
        {options.map((s) => (
          <Form.Check
            key={s._id}
            id={`swapOption-${s._id}`}
            type="radio"
            name="swapTarget"
            className="mb-1"
            label={`${s.workerName ?? "Unknown"} · ${shiftLabel(s)}`}
            checked={targetShiftId === s._id}
            onChange={() => setTargetShiftId(s._id)}
          />
        ))}
        <div className="d-flex justify-content-end mt-2">
          <Button onClick={handleSend} disabled={!targetShiftId || isSending}>
            {isSending ? "Sending..." : "Send swap request"}
          </Button>
        </div>
      </>
    );
  };

  return (
    <>
      <div className="d-flex gap-2 mb-3">
        <Button
          size="sm"
          variant={view === "create" ? "primary" : "outline-light"}
          onClick={() => setView("create")}
        >
          Create swap request
        </Button>
        <Button
          size="sm"
          variant={view === "view" ? "primary" : "outline-light"}
          onClick={() => setView("view")}
        >
          View swap requests
        </Button>
      </div>

      {view === "view" ? (
        <p className="mutedDate mb-0">Your swap requests will show here.</p>
      ) : isLoading ? (
        <div className="text-center my-3">
          <Spinner animation="border" size="sm" />
        </div>
      ) : myShifts.length === 0 ? (
        <p className="mutedDate mb-0">You have no upcoming shifts to swap.</p>
      ) : (
        <>
          <Form.Group className="mb-2" controlId="swapMyShift">
            <Form.Label className="small">My shift</Form.Label>
            <Form.Select
              value={myShiftId}
              onChange={(e) => {
                setMyShiftId(e.target.value);
                setTargetDate(""); // the allowed dates depend on the shift
                clearResults();
              }}
            >
              <option value="" disabled>
                Select one of your shifts
              </option>
              {myShifts.map((s) => (
                <option key={s._id} value={s._id}>
                  {shiftLabel(s)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-2" controlId="swapDate">
            <Form.Label className="small">Swap with a shift on</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type="date"
                value={targetDate}
                min={minDate}
                max={maxDate}
                disabled={!myShift}
                onChange={(e) => {
                  setTargetDate(e.target.value);
                  clearResults();
                }}
              />
              <Button
                variant="outline-light"
                onClick={handleFind}
                disabled={!myShift || !targetDate || isFinding}
              >
                {isFinding ? "Finding..." : "Find shifts"}
              </Button>
            </div>
            {myShift && (
              <Form.Text className="mutedDate">
                Any day from {formatShiftDate(myShift.date)} to{" "}
                {formatShiftDate(`${maxDate}T00:00:00Z`)}
              </Form.Text>
            )}
          </Form.Group>

          {renderOptions()}
        </>
      )}
    </>
  );
};
