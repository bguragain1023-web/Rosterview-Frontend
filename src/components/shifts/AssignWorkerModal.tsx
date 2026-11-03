import { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import { updateShift, type IShift, type IUser } from "../../helper/axios";
import { formatShiftDate } from "../../utils/dates";

interface AssignWorkerModalProps {
  shift: IShift | null; // null = closed
  workers: IUser[]; // active workers to choose from
  onClose: () => void;
  onAssigned: () => void;
}

export const AssignWorkerModal = ({
  shift,
  workers,
  onClose,
  onAssigned,
}: AssignWorkerModalProps) => {
  const [workerId, setWorkerId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setWorkerId("");
    onClose();
  };

  const handleAssign = async () => {
    if (!shift || !workerId) return;

    setIsSaving(true);
    const res = await updateShift(shift._id, { workerId });
    setIsSaving(false);

    if (res.status !== "success") {
      // e.g. unavailable, on leave, or already working at that time
      toast.error(res.message);
      return;
    }

    const weekly = Number(res.weeklyHours.toFixed(2));
    const overtime = Number(res.overtimeHours.toFixed(2));
    toast.success(
      `Worker assigned · ${weekly} h this week` +
        (overtime > 0 ? ` (${overtime} h overtime)` : ""),
    );
    setWorkerId("");
    onAssigned();
  };

  return (
    <Modal
      show={shift !== null}
      onHide={isSaving ? undefined : handleClose}
      centered
    >
      <Modal.Header closeButton={!isSaving}>
        <Modal.Title>Assign worker</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {shift && (
          <p className="mb-3">
            {formatShiftDate(shift.date)} · {shift.startTime}–{shift.endTime}{" "}
            · {shift.location}
          </p>
        )}
        <Form.Select
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          aria-label="Worker"
        >
          <option value="">Select worker</option>
          {workers.map((w) => (
            <option key={w._id} value={w._id}>
              {w.name}
            </option>
          ))}
        </Form.Select>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline-secondary"
          onClick={handleClose}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button onClick={handleAssign} disabled={!workerId || isSaving}>
          {isSaving ? "Assigning..." : "Assign"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
