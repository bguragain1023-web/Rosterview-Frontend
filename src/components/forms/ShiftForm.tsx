import {
  useEffect,
  useState,
  type ChangeEvent,
  type SubmitEvent,
} from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import useForm from "../../hooks/useForm";
import { useUser } from "../../contex/UserContext";
import {
  createShift,
  getAllClients,
  getAllUsers,
  updateShift,
  type CreateShiftPayload,
  type IClient,
  type IShift,
  type IUser,
  type UpdateShiftPayload,
} from "../../helper/axios";
import { toDateInputValue } from "../../utils/dates";

interface ShiftFormState {
  clientId: string;
  workerId: string; // "" = unassigned
  location: string;
  date: string; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  breakMinutes: string; // kept as text while typing, converted on submit
  notes: string;
}

const emptyState: ShiftFormState = {
  clientId: "",
  workerId: "",
  location: "",
  date: "",
  startTime: "",
  endTime: "",
  breakMinutes: "0",
  notes: "",
};

const toFormState = (shift: IShift): ShiftFormState => ({
  clientId: shift.clientId,
  workerId: shift.workerId ?? "",
  location: shift.location,
  date: shift.date.slice(0, 10), // ISO UTC midnight -> "YYYY-MM-DD"
  startTime: shift.startTime,
  endTime: shift.endTime,
  breakMinutes: String(shift.breakMinutes),
  notes: shift.notes ?? "",
});

// The backend accepts shift dates from today up to 60 days ahead.
const MAX_DAYS_AHEAD = 60;

const toMinutes = (time: string) => {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
};

// Same maths as the backend's calculateTotalHours.
const getShiftLength = (startTime: string, endTime: string) => {
  const start = toMinutes(startTime);
  let end = toMinutes(endTime);
  const isOvernight = end < start;
  if (isOvernight) end += 24 * 60;
  return { minutes: end - start, isOvernight };
};

const weeklyHoursMessage = (
  prefix: string,
  weeklyHours: number,
  overtimeHours: number,
) => {
  const weekly = Number(weeklyHours.toFixed(2));
  const overtime = Number(overtimeHours.toFixed(2));
  return (
    `${prefix} · ${weekly} h this week` +
    (overtime > 0 ? ` (${overtime} h overtime)` : "")
  );
};

interface ShiftFormProps {
  shift?: IShift; // given = edit mode
  onSaved?: () => void; // e.g. reload the roster / close the edit modal
}

export const ShiftForm = ({ shift, onSaved }: ShiftFormProps = {}) => {
  const isEdit = Boolean(shift);
  const { setActiveModal } = useUser();
  const { form, setForm, handleOnChange } = useForm<ShiftFormState>(
    shift ? toFormState(shift) : emptyState,
  );
  const [allClients, setAllClients] = useState<IClient[]>([]);
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    Promise.all([getAllClients(), getAllUsers()]).then(
      ([clientRes, userRes]) => {
        if (ignore) return;
        if (clientRes.status === "success") {
          setAllClients(clientRes.clients);
        } else {
          toast.error(clientRes.message);
        }
        if (userRes.status === "success") {
          setAllUsers(userRes.allUsers);
        } else {
          toast.error(userRes.message);
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, []);

  // Active clients/workers, plus the shift's current ones even if inactive,
  // so editing doesn't silently switch them.
  const clients = allClients.filter(
    (c) => c.isActive || c._id === shift?.clientId,
  );
  const workers = allUsers.filter(
    (u) =>
      u.role === "worker" &&
      (u.status === "active" || u._id === shift?.workerId),
  );

  const todayValue = toDateInputValue(new Date());
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + MAX_DAYS_AHEAD);
  const originalDate = shift?.date.slice(0, 10);
  // A past shift keeps its own date as the minimum, so it can still be saved.
  const minDate =
    originalDate && originalDate < todayValue ? originalDate : todayValue;

  const selectedClient = clients.find((c) => c._id === form.clientId);

  const handleClientChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const client = clients.find((c) => c._id === e.target.value);
    setForm((prev) => ({
      ...prev,
      clientId: e.target.value,
      // Fill location from the client's address, unless the user typed their own.
      location:
        !prev.location || prev.location === selectedClient?.address
          ? (client?.address ?? "")
          : prev.location,
    }));
  };

  const breakMinutes = Number(form.breakMinutes) || 0;
  const shiftLength =
    form.startTime && form.endTime
      ? getShiftLength(form.startTime, form.endTime)
      : null;
  const workedHours = shiftLength
    ? Number(((shiftLength.minutes - breakMinutes) / 60).toFixed(2))
    : null;

  const handleCreate = async () => {
    const payload: CreateShiftPayload = {
      clientId: form.clientId,
      location: form.location.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      breakMinutes,
      ...(form.workerId ? { workerId: form.workerId } : {}),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    };

    setIsSaving(true);
    const res = await createShift(payload);
    setIsSaving(false);

    if (res.status !== "success") {
      toast.error(res.message);
      return;
    }

    toast.success(
      res.shift.workerId
        ? weeklyHoursMessage(
            "Shift created",
            res.weeklyHours,
            res.overtimeHours,
          )
        : "Unassigned shift created",
    );

    setForm(emptyState);
    setActiveModal(null);
    onSaved?.();
  };

  const handleUpdate = async (original: IShift) => {
    const before = toFormState(original);
    const changes: UpdateShiftPayload = {};

    if (form.clientId !== before.clientId) changes.clientId = form.clientId;
    if (form.workerId !== before.workerId) {
      changes.workerId = form.workerId || null; // "" -> unassign
    }
    if (form.location.trim() !== before.location) {
      changes.location = form.location.trim();
    }
    if (form.date !== before.date) {
      if (form.date < todayValue) {
        toast.error("A new date can't be in the past");
        return;
      }
      changes.date = form.date;
    }
    if (form.startTime !== before.startTime) changes.startTime = form.startTime;
    if (form.endTime !== before.endTime) changes.endTime = form.endTime;
    if (breakMinutes !== original.breakMinutes) {
      changes.breakMinutes = breakMinutes;
    }
    if (form.notes.trim() !== before.notes) changes.notes = form.notes.trim();

    if (Object.keys(changes).length === 0) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);
    const res = await updateShift(original._id, changes);
    setIsSaving(false);

    if (res.status !== "success") {
      toast.error(res.message);
      return;
    }

    toast.success(
      form.workerId
        ? weeklyHoursMessage(
            "Shift updated",
            res.weeklyHours,
            res.overtimeHours,
          )
        : "Shift updated",
    );
    onSaved?.();
  };

  const handleOnSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (form.startTime === form.endTime) {
      toast.error("Start and end time can't be the same");
      return;
    }
    if (shiftLength && breakMinutes >= shiftLength.minutes) {
      toast.error("Break must be shorter than the shift");
      return;
    }

    if (shift) {
      await handleUpdate(shift);
    } else {
      await handleCreate();
    }
  };

  return (
    <Form onSubmit={handleOnSubmit}>
      <Form.Group className="mb-3" controlId="shiftClient">
        <Form.Label>Client</Form.Label>
        <Form.Select
          name="clientId"
          value={form.clientId}
          onChange={handleClientChange}
          required
        >
          <option value="">Select client</option>
          {clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
              {!c.isActive && " (inactive)"}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3" controlId="shiftLocation">
        <Form.Label>Location</Form.Label>
        <Form.Control
          type="text"
          name="location"
          value={form.location}
          onChange={handleOnChange}
          placeholder="Filled from the client's address"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="shiftWorker">
        <Form.Label>Worker</Form.Label>
        <Form.Select
          name="workerId"
          value={form.workerId}
          onChange={handleOnChange}
        >
          <option value="">Unassigned</option>
          {workers.map((w) => (
            <option key={w._id} value={w._id}>
              {w.name}
              {w.status !== "active" && " (inactive)"}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="shiftDate">
            <Form.Label>Date</Form.Label>
            <Form.Control
              type="date"
              name="date"
              value={form.date}
              onChange={handleOnChange}
              min={minDate}
              max={toDateInputValue(maxDate)}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="shiftBreak">
            <Form.Label>Break (minutes)</Form.Label>
            <Form.Control
              type="number"
              name="breakMinutes"
              value={form.breakMinutes}
              onChange={handleOnChange}
              min={0}
              step={1}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="shiftStart">
            <Form.Label>Start time</Form.Label>
            <Form.Control
              type="time"
              name="startTime"
              value={form.startTime}
              onChange={handleOnChange}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="shiftEnd">
            <Form.Label>End time</Form.Label>
            <Form.Control
              type="time"
              name="endTime"
              value={form.endTime}
              onChange={handleOnChange}
              required
            />
          </Form.Group>
        </Col>
      </Row>

      {workedHours !== null && (
        <p className="mutedDate">
          {workedHours > 0 ? `${workedHours} h` : "No working time"}
          {shiftLength?.isOvernight && " · overnight"}
        </p>
      )}

      <Form.Group className="mb-3" controlId="shiftNotes">
        <Form.Label>Notes</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          name="notes"
          value={form.notes}
          onChange={handleOnChange}
          placeholder="Optional"
        />
      </Form.Group>

      <Button type="submit" disabled={isSaving}>
        {isSaving
          ? isEdit
            ? "Saving..."
            : "Creating..."
          : isEdit
            ? "Save changes"
            : "Create shift"}
      </Button>
    </Form>
  );
};
