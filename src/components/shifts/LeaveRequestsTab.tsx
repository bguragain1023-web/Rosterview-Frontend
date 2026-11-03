import { useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { ConfirmModal } from "../custom/ConfirmModal";
import { DataTable, type Column } from "../custom/DataTable";
import {
  getShifts,
  reviewLeaveRequest,
  type ILeaveRequest,
  type IShift,
} from "../../helper/axios";
import { formatShiftDate } from "../../utils/dates";

type View = "pending" | "history";

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });

// Leave dates are stored as UTC midnight; both ends are inclusive.
const leaveDays = (leave: ILeaveRequest) =>
  Math.round(
    (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) /
      DAY_MS,
  ) + 1;

const leaveRange = (leave: ILeaveRequest) =>
  leave.startDate === leave.endDate
    ? formatShiftDate(leave.startDate)
    : `${formatShiftDate(leave.startDate)} – ${formatShiftDate(leave.endDate)}`;

interface Decision {
  status: "approved" | "rejected";
  leave: ILeaveRequest;
}

interface LeaveRequestsTabProps {
  leaves: ILeaveRequest[];
  isLoading: boolean;
  clientNames: Map<string, string>;
  onChanged: () => void; // reload leave and the roster
}

export const LeaveRequestsTab = ({
  leaves,
  isLoading,
  clientNames,
  onChanged,
}: LeaveRequestsTabProps) => {
  const [view, setView] = useState<View>("pending");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [comment, setComment] = useState("");
  // The worker's assigned shifts during the leave (approve dialog only)
  const [affectedShifts, setAffectedShifts] = useState<IShift[] | null>(null);
  const [unassignShifts, setUnassignShifts] = useState(true);

  const pending = leaves.filter((l) => l.status === "pending");
  const rows = view === "pending" ? pending : leaves.filter((l) => l.status !== "pending");

  const openDecision = async (
    status: "approved" | "rejected",
    leave: ILeaveRequest,
  ) => {
    setComment("");
    setUnassignShifts(true);
    setAffectedShifts(null);
    setDecision({ status, leave });

    if (status !== "approved" || !leave.workerId) return;

    const workerId = leave.workerId._id;
    const res = await getShifts({
      from: leave.startDate.slice(0, 10),
      to: leave.endDate.slice(0, 10),
    });
    if (res.status === "success") {
      setAffectedShifts(
        res.allShifts.filter(
          (s) => s.workerId === workerId && s.status === "assigned",
        ),
      );
    } else {
      toast.error(res.message);
      setAffectedShifts([]);
    }
  };

  const handleDecision = async () => {
    if (!decision) return;
    const { status, leave } = decision;
    if (status === "approved" && leave.workerId && affectedShifts === null) {
      toast.info("Still checking rostered shifts, try again in a moment");
      return;
    }
    const hasAffected = (affectedShifts?.length ?? 0) > 0;

    const res = await reviewLeaveRequest(
      leave._id,
      status,
      comment.trim() || undefined,
      status === "approved" && hasAffected ? unassignShifts : undefined,
    );
    if (res.status !== "success") {
      toast.error(res.message);
      return;
    }

    if (status === "approved") {
      const n = res.unassignedShifts;
      toast.success(
        n > 0
          ? `Leave approved · ${n} shift${n === 1 ? "" : "s"} unassigned`
          : "Leave approved",
      );
    } else {
      toast.success("Leave rejected");
    }
    setDecision(null);
    onChanged();
  };

  const columns: Column<ILeaveRequest>[] = [
    { header: "Requested", render: (l) => formatDay(l.createdAt) },
    { header: "Worker", render: (l) => l.workerId?.name ?? "Unknown" },
    {
      header: "Dates",
      render: (l) => {
        const days = leaveDays(l);
        return (
          <>
            <div>{leaveRange(l)}</div>
            <div className="mutedDate">
              {days} day{days === 1 ? "" : "s"}
            </div>
          </>
        );
      },
    },
    {
      header: "Type",
      render: (l) => <span className="text-capitalize">{l.type}</span>,
    },
    {
      header: "Reason",
      render: (l) => l.reason || <span className="mutedDate">—</span>,
    },
    {
      header: "Status",
      render: (l) => (
        <>
          <span className={`leaveStatus ${l.status}`}>{l.status}</span>
          {l.reviewedBy && (
            <div className="mutedDate mt-1">
              by {l.reviewedBy.name}
              {l.reviewedAt && ` · ${formatDay(l.reviewedAt)}`}
            </div>
          )}
          {l.reviewComment && (
            <div className="mutedDate mt-1">“{l.reviewComment}”</div>
          )}
        </>
      ),
    },
    {
      header: "Actions",
      render: (l) =>
        l.status === "pending" && (
          <div className="d-flex gap-2">
            <Button size="sm" onClick={() => openDecision("approved", l)}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => openDecision("rejected", l)}
            >
              Reject
            </Button>
          </div>
        ),
    },
  ];

  const leave = decision?.leave;
  const workerName = leave?.workerId?.name ?? "This worker";
  const leaveText = leave
    ? `${workerName}'s ${leave.type} leave, ${leaveRange(leave)} (${leaveDays(leave)} day${leaveDays(leave) === 1 ? "" : "s"})`
    : "";

  const renderAffectedShifts = () => {
    if (affectedShifts === null) {
      return (
        <p className="mutedDate">
          <Spinner animation="border" size="sm" /> Checking rostered shifts…
        </p>
      );
    }
    if (affectedShifts.length === 0) {
      return <p className="mutedDate">No rostered shifts are affected.</p>;
    }
    return (
      <>
        <p className="mb-1">
          {workerName} has {affectedShifts.length} shift
          {affectedShifts.length === 1 ? "" : "s"} during this leave:
        </p>
        <ul className="mb-2">
          {affectedShifts.map((s) => (
            <li key={s._id}>
              {formatShiftDate(s.date)} · {s.startTime}–{s.endTime} ·{" "}
              {clientNames.get(s.clientId) ?? "Unknown client"}
            </li>
          ))}
        </ul>
        <Form.Check
          id="unassignLeaveShifts"
          type="checkbox"
          className="mb-3"
          label={`Unassign ${workerName} from these shifts so they can be covered`}
          checked={unassignShifts}
          onChange={(e) => setUnassignShifts(e.target.checked)}
        />
      </>
    );
  };

  return (
    <>
      <div className="d-flex gap-2 mb-3">
        <Button
          size="sm"
          variant={view === "pending" ? "primary" : "outline-light"}
          onClick={() => setView("pending")}
        >
          Pending ({pending.length})
        </Button>
        <Button
          size="sm"
          variant={view === "history" ? "primary" : "outline-light"}
          onClick={() => setView("history")}
        >
          History
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
        </div>
      ) : rows.length === 0 ? (
        <p className="mutedDate text-center my-5">No leave requests here.</p>
      ) : (
        <div key={view}>
          <DataTable columns={columns} rows={rows} getKey={(l) => l._id} />
        </div>
      )}

      <ConfirmModal
        show={decision !== null}
        title={decision?.status === "approved" ? "Approve leave" : "Reject leave"}
        message={
          <>
            <p>
              {decision?.status === "approved" ? "Approve" : "Reject"}{" "}
              {leaveText}?
            </p>
            {decision?.status === "approved" && renderAffectedShifts()}
            <Form.Group controlId="leaveComment">
              <Form.Label>Comment (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </Form.Group>
          </>
        }
        confirmLabel={decision?.status === "approved" ? "Approve" : "Reject"}
        variant={decision?.status === "approved" ? "primary" : "danger"}
        onConfirm={handleDecision}
        onCancel={() => setDecision(null)}
      />
    </>
  );
};
