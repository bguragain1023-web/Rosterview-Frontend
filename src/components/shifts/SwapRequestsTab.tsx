import { useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { ConfirmModal } from "../custom/ConfirmModal";
import { DataTable, type Column } from "../custom/DataTable";
import {
  reviewSwapRequest,
  type ISwapRequest,
  type SwapShiftInfo,
  type SwapStatus,
} from "../../helper/axios";
import { formatShiftDate } from "../../utils/dates";

type View = "review" | "waiting" | "history";

const viewStatuses: Record<View, SwapStatus[]> = {
  review: ["workerAccepted"],
  waiting: ["pending"],
  history: ["accepted", "rejected", "cancelled"],
};

const statusLabels: Record<SwapStatus, string> = {
  pending: "Waiting on worker",
  workerAccepted: "Needs review",
  accepted: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });

const shiftSummary = (shift: SwapShiftInfo | null) =>
  shift
    ? `${formatShiftDate(shift.date)} ${shift.startTime}–${shift.endTime}`
    : "a deleted shift";

interface SwapRequestsTabProps {
  swaps: ISwapRequest[];
  isLoading: boolean;
  clientNames: Map<string, string>;
  onChanged: () => void; // reload swaps and the roster
}

export const SwapRequestsTab = ({
  swaps,
  isLoading,
  clientNames,
  onChanged,
}: SwapRequestsTabProps) => {
  const [view, setView] = useState<View>("review");
  const [decision, setDecision] = useState<{
    action: "accept" | "reject";
    swap: ISwapRequest;
  } | null>(null);
  const [comment, setComment] = useState("");

  const count = (v: View) =>
    swaps.filter((s) => viewStatuses[v].includes(s.status)).length;
  const rows = swaps.filter((s) => viewStatuses[view].includes(s.status));

  const openDecision = (action: "accept" | "reject", swap: ISwapRequest) => {
    setComment("");
    setDecision({ action, swap });
  };

  const handleDecision = async () => {
    if (!decision) return;
    const res = await reviewSwapRequest(
      decision.swap._id,
      decision.action,
      comment.trim() || undefined,
    );
    if (res.status !== "success") {
      // e.g. a worker is now on leave or has a clashing shift
      toast.error(res.message);
      return;
    }
    toast.success(
      decision.action === "accept" ? "Swap approved" : "Swap rejected",
    );
    setDecision(null);
    onChanged();
  };

  const renderShift = (shift: SwapShiftInfo | null) =>
    shift ? (
      <>
        <div>
          {formatShiftDate(shift.date)} · {shift.startTime}–{shift.endTime}
        </div>
        <div className="mutedDate">
          {clientNames.get(shift.clientId) ?? "Unknown client"} ·{" "}
          {shift.location}
        </div>
      </>
    ) : (
      <span className="mutedDate">Shift deleted</span>
    );

  const columns: Column<ISwapRequest>[] = [
    { header: "Requested", render: (s) => formatDay(s.createdAt) },
    {
      header: "From",
      render: (s) => (
        <>
          <div className="fw-semibold">{s.requestedBy?.name ?? "Unknown"}</div>
          {renderShift(s.requestedShiftId)}
        </>
      ),
    },
    {
      header: "To",
      render: (s) => (
        <>
          <div className="fw-semibold">{s.requestedTo?.name ?? "Unknown"}</div>
          {renderShift(s.targetedShiftId)}
        </>
      ),
    },
    {
      header: "Status",
      render: (s) => (
        <>
          <span className={`swapStatus ${s.status}`}>
            {statusLabels[s.status]}
          </span>
          {s.status === "pending" && (
            <div className="mutedDate mt-1">
              Waiting for {s.requestedTo?.name ?? "the other worker"} to
              respond
            </div>
          )}
          {s.reviewedBy && (
            <div className="mutedDate mt-1">
              by {s.reviewedBy.name}
              {s.reviewedAt && ` · ${formatDay(s.reviewedAt)}`}
            </div>
          )}
          {s.reviewComment && (
            <div className="mutedDate mt-1">“{s.reviewComment}”</div>
          )}
        </>
      ),
    },
    {
      header: "Actions",
      render: (s) => (
        <div className="d-flex gap-2">
          {s.status === "workerAccepted" && (
            <Button size="sm" onClick={() => openDecision("accept", s)}>
              Approve
            </Button>
          )}
          {(s.status === "workerAccepted" || s.status === "pending") && (
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => openDecision("reject", s)}
            >
              Reject
            </Button>
          )}
        </div>
      ),
    },
  ];

  const viewButton = (v: View, label: string) => (
    <Button
      size="sm"
      variant={view === v ? "primary" : "outline-light"}
      onClick={() => setView(v)}
    >
      {label}
      {v !== "history" && ` (${count(v)})`}
    </Button>
  );

  const swap = decision?.swap;
  const swapText = swap
    ? `${swap.requestedBy?.name ?? "Unknown"}'s ${shiftSummary(swap.requestedShiftId)} with ${swap.requestedTo?.name ?? "Unknown"}'s ${shiftSummary(swap.targetedShiftId)}`
    : "";

  return (
    <>
      <div className="d-flex gap-2 mb-3">
        {viewButton("review", "Needs review")}
        {viewButton("waiting", "Waiting on worker")}
        {viewButton("history", "History")}
      </div>

      {isLoading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
        </div>
      ) : rows.length === 0 ? (
        <p className="mutedDate text-center my-5">No swap requests here.</p>
      ) : (
        <div key={view}>
          <DataTable columns={columns} rows={rows} getKey={(s) => s._id} />
        </div>
      )}

      <ConfirmModal
        show={decision !== null}
        title={decision?.action === "accept" ? "Approve swap" : "Reject swap"}
        message={
          <>
            <p>
              {decision?.action === "accept"
                ? `Swap ${swapText}? Both workers are checked again for leave, availability and clashes first.`
                : `Reject the request to swap ${swapText}?`}
            </p>
            <Form.Group controlId="swapComment">
              <Form.Label>Comment (optional)</Form.Label>
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
        confirmLabel={decision?.action === "accept" ? "Approve" : "Reject"}
        variant={decision?.action === "accept" ? "primary" : "danger"}
        onConfirm={handleDecision}
        onCancel={() => setDecision(null)}
      />
    </>
  );
};
