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
  type CreateShiftPayload,
  type IClient,
  type IUser,
} from "../../helper/axios";

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

const initialState: ShiftFormState = {
  clientId: "",
  workerId: "",
  location: "",
  date: "",
  startTime: "",
  endTime: "",
  breakMinutes: "0",
  notes: "",
};

// The backend accepts shifts from today up to 60 days ahead.
const MAX_DAYS_AHEAD = 60;

const toDateInputValue = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

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

export const CreateShiftForm = () => {
  const { setActiveModal } = useUser();
  const { form, setForm, handleOnChange } =
    useForm<ShiftFormState>(initialState);
  const [clients, setClients] = useState<IClient[]>([]);
  const [workers, setWorkers] = useState<IUser[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    Promise.all([getAllClients(), getAllUsers()]).then(
      ([clientRes, userRes]) => {
        if (ignore) return;

        if (clientRes.status === "success") {
          setClients(clientRes.clients.filter((c) => c.isActive));
        } else {
          toast.error(clientRes.message);
        }

        if (userRes.status === "success") {
          setWorkers(
            userRes.allUsers.filter(
              (u) => u.role === "worker" && u.status === "active",
            ),
          );
        } else {
          toast.error(userRes.message);
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, []);

  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + MAX_DAYS_AHEAD);

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

    if (res.shift.workerId) {
      const weekly = Number(res.weeklyHours.toFixed(2));
      const overtime = Number(res.overtimeHours.toFixed(2));
      toast.success(
        `Shift created · ${weekly} h this week` +
          (overtime > 0 ? ` (${overtime} h overtime)` : ""),
      );
    } else {
      toast.success("Unassigned shift created");
    }

    setForm(initialState);
    setActiveModal(null);
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
              min={toDateInputValue(today)}
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
        {isSaving ? "Creating..." : "Create shift"}
      </Button>
    </Form>
  );
};
