import { useEffect, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useUser } from "../../contex/UserContext";
import { ConfirmModal } from "../custom/ConfirmModal";
import {
  cancelSwapRequest,
  getSwapRequests,
  respondToSwapRequest,
  type ISwapRequest,
  type SwapShiftInfo,
  type SwapStatus,
} from "../../helper/axios";
import { formatShiftDate } from "../../utils/dates";

// "Sat 22 Nov · 08:00–14:00 · 12 Smith St"
const shiftText = (s: SwapShiftInfo | null) =>
  s
    ? `${formatShiftDate(s.date)} · ${s.startTime}–${s.endTime} · ${s.location}`
    : "Shift no longer exists";

// The pill text depends on which side of the request I'm on.
const statusText = (status: SwapStatus, iAsked: boolean, other: string) => {
  switch (status) {
    case "pending":
      return iAsked ? `Waiting for ${other}` : "Needs your answer";
    case "workerAccepted":
      return "Waiting for manager";
    case "accepted":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
  }
};

// The small line explaining who decided, or null if nobody has yet.
const outcomeText = (s: ISwapRequest, iAsked: boolean, other: string) => {
  if (s.reviewedBy) {
    const verb = s.status === "accepted" ? "Approved" : "Rejected";
    const comment = s.reviewComment ? ` — “${s.reviewComment}”` : "";
    return `${verb} by ${s.reviewedBy.name}${comment}`;
  }
  // Rejected with no manager = the teammate said no.
  if (s.status === "rejected") return iAsked ? `${other} declined` : "You declined";
  return null;
};

export const MySwapRequests = () => {
  const { user } = useUser();
  const [swaps, setSwaps] = useState<ISwapRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  // The request being answered, so only its buttons are disabled.
  const [respondingId, setRespondingId] = useState<string | null>(null);
  // The request whose "Cancel request" dialog is open (null = closed).
  const [cancelling, setCancelling] = useState<ISwapRequest | null>(null);

  // For a worker, the backend returns only swaps they sent or received.
  useEffect(() => {
    let ignore = false;

    getSwapRequests().then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setSwaps(res.swapRequests);
      } else {
        toast.error(res.message);
      }
      setIsLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const handleRespond = async (
    swap: ISwapRequest,
    action: "accept" | "reject",
  ) => {
    setRespondingId(swap._id);
    const res = await respondToSwapRequest(swap._id, action);
    setRespondingId(null);

    toast[res.status](res.message);
    if (res.status === "success") setReloadKey((k) => k + 1);
  };

  const handleCancel = async () => {
    if (!cancelling) return;
    const res = await cancelSwapRequest(cancelling._id);
    toast[res.status](res.message);
    // Close and reload either way: the usual error is "already decided",
    // so the list needs refreshing to show what happened.
    setCancelling(null);
    setReloadKey((k) => k + 1);
  };

  if (isLoading) {
    return (
      <div className="text-center my-3">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }

  if (swaps.length === 0) {
    return <p className="mutedDate mb-0">No swap requests yet.</p>;
  }

  return (
    <>
    <ul className="leaveList">
      {swaps.map((s) => {
        // Seen from my side: did I ask, or was I asked?
        const iAsked = s.requestedBy?._id === user?._id;
        const other =
          (iAsked ? s.requestedTo : s.requestedBy)?.name ?? "A former teammate";
        const myShift = iAsked ? s.requestedShiftId : s.targetedShiftId;
        const theirShift = iAsked ? s.targetedShiftId : s.requestedShiftId;
        const outcome = outcomeText(s, iAsked, other);
        // I sent it and nobody has made a final decision yet
        const canCancel =
          iAsked && (s.status === "pending" || s.status === "workerAccepted");

        return (
          <li key={s._id}>
            <div className="leaveListMain">
              <span>{iAsked ? `You asked ${other}` : `${other} asked you`}</span>
              <span className={`swapStatus ${s.status}`}>
                {statusText(s.status, iAsked, other)}
              </span>
            </div>
            <div className="mutedDate">Your shift: {shiftText(myShift)}</div>
            <div className="mutedDate">Their shift: {shiftText(theirShift)}</div>
            {outcome && <div className="mutedDate small">{outcome}</div>}

            {canCancel && (
              <div className="d-flex justify-content-end mt-2">
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => setCancelling(s)}
                >
                  Cancel request
                </Button>
              </div>
            )}

            {!iAsked && s.status === "pending" && (
              <div className="d-flex gap-2 justify-content-end mt-2">
                <Button
                  size="sm"
                  onClick={() => handleRespond(s, "accept")}
                  disabled={respondingId === s._id}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => handleRespond(s, "reject")}
                  disabled={respondingId === s._id}
                >
                  Reject
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>

    <ConfirmModal
      show={cancelling !== null}
      title="Cancel swap request"
      message={
        <>
          Cancel your swap request with{" "}
          {cancelling?.requestedTo?.name ?? "your teammate"}? Your shifts stay
          as they are.
        </>
      }
      confirmLabel="Yes, cancel request"
      variant="danger"
      onConfirm={handleCancel}
      onCancel={() => setCancelling(null)}
    />
    </>
  );
};
