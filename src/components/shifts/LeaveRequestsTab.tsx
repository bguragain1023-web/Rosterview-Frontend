import { useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { ConfirmModal } from "../custom/ConfirmModal";
import { DataTable, type Column } from "../custom/DataTable";
import {
  cancelApprovedLeave,
  getShifts,
  reviewLeaveRequest,
  type ILeaveRequest,
  type IShift,
} from "../../helper/axios";
import { formatShiftDate } from "../../utils/dates";
import {
  formatShortDay,
  leaveDays,
  leaveRange,
  plural,
} from "../../utils/leave";

type View = "pending" | "history";

// One dialog handles all three actions:
// "approved" / "rejected" for pending requests, "cancel" for approved leave.
type DecisionKind = "approved" | "rejected" | "cancel";

interface Decision {
  kind: DecisionKind;
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
  // Comment (approve/reject) or reason (cancel): same text box.
  const [comment, setComment] = useState("");
  // The worker's assigned shifts during the leave (approve dialog only)
  const [affectedShifts, setAffectedShifts] = useState<IShift[] | null>(null);
  const [unassignShifts, setUnassignShifts] = useState(true);

  const pending = leaves.filter((l) => l.status === "pending");
  const rows =
    view === "pending" ? pending : leaves.filter((l) => l.status !== "pending");

  const openDecision = async (kind: DecisionKind, leave: ILeaveRequest) => {
    setComment("");
    setUnassignShifts(true);
    setAffectedShifts(null);
    setDecision({ kind, leave });

    // Only approving needs to look at the worker's rostered shifts.
    if (kind !== "approved" || !leave.workerId) return;

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
    const { kind, leave } = decision;
    const text = comment.trim() || undefined;

    // Cancel approved leave
    if (kind === "cancel") {
      const res = await cancelApprovedLeave(leave._id, text);
      toast[res.status](res.message);
      if (res.status === "success") {
        setDecision(null);
        onChanged();
      }
      return;
    }

    // Approve / reject a pending request
    if (kind === "approved" && leave.workerId && affectedShifts === null) {
      toast.info("Still checking rostered shifts, try again in a moment");
      return;
    }
    const hasAffected = (affectedShifts?.length ?? 0) > 0;

    const res = await reviewLeaveRequest(
      leave._id,
      kind,
      text,
      kind === "approved" && hasAffected ? unassignShifts : undefined,
    );
    if (res.status !== "success") {
      toast.error(res.message);
      return;
    }

    if (kind === "approved") {
      const n = res.unassignedShifts;
      toast.success(
        n > 0
          ? `Leave approved · ${plural(n, "shift")} unassigned`
          : "Leave approved",
      );
    } else {
      toast.success("Leave rejected");
    }
    setDecision(null);
    onChanged();
  };

  const columns: Column<ILeaveRequest>[] = [
    { header: "Requested", render: (l) => formatShortDay(l.createdAt) },
    { header: "Worker", render: (l) => l.workerId?.name ?? "Unknown" },
    {
      header: "Dates",
      render: (l) => (
        <>
          <div>{leaveRange(l)}</div>
          <div className="mutedDate">{plural(leaveDays(l), "day")}</div>
        </>
      ),
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
              {l.status === "rejected" ? "rejected" : "approved"} by{" "}
              {l.reviewedBy.name}
              {l.reviewedAt && ` · ${formatShortDay(l.reviewedAt)}`}
            </div>
          )}
          {l.reviewComment && (
            <div className="mutedDate mt-1">“{l.reviewComment}”</div>
          )}
          {/* Approved leave that a manager cancelled afterwards */}
          {l.cancelledBy && (
            <div className="mutedDate mt-1">
              cancelled by {l.cancelledBy.name}
              {l.cancelledAt && ` · ${formatShortDay(l.cancelledAt)}`}
              {l.cancelReason && ` — “${l.cancelReason}”`}
            </div>
          )}
        </>
      ),
    },
    {
      header: "Actions",
      render: (l) => {
        if (l.status === "pending") {
          return (
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
          );
        }
        if (l.status === "approved") {
          return (
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => openDecision("cancel", l)}
            >
              Cancel leave
            </Button>
          );
        }
        return null;
      },
    },
  ];

  const leave = decision?.leave;
  const workerName = leave?.workerId?.name ?? "This worker";
  const leaveText = leave
    ? `${workerName}'s ${leave.type} leave, ${leaveRange(leave)} (${plural(leaveDays(leave), "day")})`
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
          {workerName} has {plural(affectedShifts.length, "shift")} during this
          leave:
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

  // Title, question, button and colour for each kind of decision.
  const dialog: Record<
    DecisionKind,
    { title: string; question: string; label: string; textLabel: string }
  > = {
    approved: {
      title: "Approve leave",
      question: `Approve ${leaveText}?`,
      label: "Approve",
      textLabel: "Comment (optional)",
    },
    rejected: {
      title: "Reject leave",
      question: `Reject ${leaveText}?`,
      label: "Reject",
      textLabel: "Comment (optional)",
    },
    cancel: {
      title: "Cancel approved leave",
      question: `Cancel ${leaveText}? They'll be available on those days again. Shifts that were unassigned when the leave was approved stay unassigned.`,
      label: "Cancel leave",
      textLabel: "Reason (optional)",
    },
  };
  const current = decision ? dialog[decision.kind] : null;

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
        title={current?.title ?? ""}
        message={
          <>
            <p>{current?.question}</p>
            {decision?.kind === "approved" && renderAffectedShifts()}
            <Form.Group controlId="leaveComment">
              <Form.Label>{current?.textLabel}</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </Form.Group>
          </>
        }
        confirmLabel={current?.label}
        variant={decision?.kind === "approved" ? "primary" : "danger"}
        onConfirm={handleDecision}
        onCancel={() => setDecision(null)}
      />
    </>
  );
};
