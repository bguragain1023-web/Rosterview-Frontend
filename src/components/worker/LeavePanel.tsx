import { useEffect, useState, type SubmitEvent } from "react";
import { Button, Col, Form, Row, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { ConfirmModal } from "../custom/ConfirmModal";
import {
  createLeaveRequest,
  getLeaveRequests,
  withdrawLeaveRequest,
  type ILeaveRequest,
  type LeaveType,
} from "../../helper/axios";
import { toDateInputValue } from "../../utils/dates";
import {
  LEAVE_TYPES,
  daysBetween,
  formatShortDay,
  leaveDays,
  leaveRange,
  plural,
} from "../../utils/leave";

interface LeaveForm {
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
  type: LeaveType;
  reason: string;
}

const emptyForm: LeaveForm = {
  startDate: "",
  endDate: "",
  type: "annual",
  reason: "",
};

interface LeavePanelProps {
  onChanged: () => void; // e.g. refresh the calendar's dots
}

export const LeavePanel = ({ onChanged }: LeavePanelProps) => {
  // Controlled form: React holds every field's value.
  const [form, setForm] = useState<LeaveForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const [leaves, setLeaves] = useState<ILeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0); // bump to reload the list
  const [withdrawing, setWithdrawing] = useState<ILeaveRequest | null>(null);

  const todayKey = toDateInputValue(new Date());

  // My requests (the backend only returns this worker's own).
  useEffect(() => {
    let ignore = false;

    getLeaveRequests().then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setLeaves(res.leaveRequests);
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

  // Derived value: worked out from the form on every render, never stored.
  // "YYYY-MM-DD" text sorts like the dates, so >= compares them correctly.
  const days =
    form.startDate && form.endDate && form.endDate >= form.startDate
      ? daysBetween(form.startDate, form.endDate)
      : null;

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); // stop the browser reloading the page

    if (form.startDate < todayKey) {
      toast.error("Leave can't start in the past");
      return;
    }
    if (!days) {
      toast.error("End date must be on or after the start date");
      return;
    }

    setIsSaving(true); // disables the button: no double submit
    const reason = form.reason.trim();
    const res = await createLeaveRequest({
      startDate: form.startDate,
      endDate: form.endDate,
      type: form.type,
      ...(reason ? { reason } : {}),
    });
    setIsSaving(false);

    toast[res.status](res.message); // e.g. "overlaps an existing request"
    if (res.status === "success") {
      setForm(emptyForm);
      afterChange();
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawing) return;
    const res = await withdrawLeaveRequest(withdrawing._id);
    if (res.status !== "success") {
      toast.error(res.message);
      return;
    }
    toast.success("Leave request withdrawn");
    setWithdrawing(null);
    afterChange();
  };

  // The small line under each request explaining what happened to it.
  const statusDetails = (l: ILeaveRequest) => {
    if (l.status === "cancelled" && l.cancelledBy) {
      return (
        <>
          Cancelled by {l.cancelledBy.name}
          {l.cancelledAt && ` · ${formatShortDay(l.cancelledAt)}`}
          {l.cancelReason && ` — “${l.cancelReason}”`}
        </>
      );
    }
    if (l.status === "cancelled") return "Withdrawn";
    if (l.reviewedBy) {
      return (
        <>
          {l.status === "approved" ? "Approved" : "Rejected"} by{" "}
          {l.reviewedBy.name}
          {l.reviewedAt && ` · ${formatShortDay(l.reviewedAt)}`}
          {l.reviewComment && ` — “${l.reviewComment}”`}
        </>
      );
    }
    return null;
  };

  return (
    <>
      <div className="teamMembersTitle mt-0 pt-0 border-0">REQUEST LEAVE</div>
      <Form onSubmit={handleSubmit}>
        <Row className="g-2">
          <Col sm={6} md={3}>
            <Form.Group controlId="leaveStart">
              <Form.Label className="small">Start</Form.Label>
              <Form.Control
                type="date"
                value={form.startDate}
                min={todayKey}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                required
              />
            </Form.Group>
          </Col>
          <Col sm={6} md={3}>
            <Form.Group controlId="leaveEnd">
              <Form.Label className="small">End</Form.Label>
              <Form.Control
                type="date"
                value={form.endDate}
                // can't end before it starts
                min={form.startDate || todayKey}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </Form.Group>
          </Col>
          <Col sm={6} md={3}>
            <Form.Group controlId="leaveType">
              <Form.Label className="small">Type</Form.Label>
              <Form.Select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as LeaveType })
                }
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mt-2" controlId="leaveReason">
          <Form.Label className="small">Reason (optional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </Form.Group>

        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="mutedDate">{days ? plural(days, "day") : ""}</span>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Sending..." : "Request leave"}
          </Button>
        </div>
      </Form>

      <div className="teamMembersTitle">MY REQUESTS</div>
      {isLoading ? (
        <div className="text-center my-3">
          <Spinner animation="border" size="sm" />
        </div>
      ) : leaves.length === 0 ? (
        <p className="mutedDate mb-0">You haven't requested any leave yet.</p>
      ) : (
        <ul className="leaveList">
          {leaves.map((l) => {
            const details = statusDetails(l);
            return (
              <li key={l._id}>
                <div className="leaveListMain">
                  <span>
                    {leaveRange(l)} · {plural(leaveDays(l), "day")} ·{" "}
                    <span className="text-capitalize">{l.type}</span>
                  </span>
                  <span className={`leaveStatus ${l.status}`}>{l.status}</span>
                  {l.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => setWithdrawing(l)}
                    >
                      Withdraw
                    </Button>
                  )}
                </div>
                {l.reason && <div className="mutedDate">“{l.reason}”</div>}
                {details && <div className="mutedDate small">{details}</div>}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        show={withdrawing !== null}
        title="Withdraw leave request"
        message={
          <>
            Withdraw your leave request for{" "}
            {withdrawing ? leaveRange(withdrawing) : ""}? You can submit a new
            one afterwards.
          </>
        }
        confirmLabel="Withdraw"
        variant="danger"
        onConfirm={handleWithdraw}
        onCancel={() => setWithdrawing(null)}
      />
    </>
  );
};
