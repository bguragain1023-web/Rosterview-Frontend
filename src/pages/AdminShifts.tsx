import { useEffect, useState, type ReactNode } from "react";
import { Button, Container, Dropdown, Form, Spinner } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { IoMdAdd } from "react-icons/io";
import { toast } from "react-toastify";
import { useUser } from "../contex/UserContext";
import { AppModal } from "../components/custom/AppModal";
import { ConfirmModal } from "../components/custom/ConfirmModal";
import { DataTable, type Column } from "../components/custom/DataTable";
import { ShiftForm } from "../components/forms/ShiftForm";
import { AssignWorkerModal } from "../components/shifts/AssignWorkerModal";
import { SwapRequestsTab } from "../components/shifts/SwapRequestsTab";
import { LeaveRequestsTab } from "../components/shifts/LeaveRequestsTab";
import {
  cancelShift,
  deleteShifts,
  reinstateShift,
  getAllClients,
  getAllUsers,
  getShifts,
  getSwapRequests,
  getLeaveRequests,
  updateShift,
  type ILeaveRequest,
  type IShift,
  type ISwapRequest,
  type IUser,
  type ShiftStatus,
} from "../helper/axios";
import {
  addDays,
  formatShiftDate,
  startOfWeek,
  toDateInputValue,
} from "../utils/dates";

type Tab = "roster" | "swaps" | "leave";
type StatusFilter = "all" | ShiftStatus;
type ConfirmType = "unassign" | "cancel" | "reinstate" | "delete";
type ConfirmAction = { type: ConfirmType; shift: IShift } | null;

const successMessages: Record<ConfirmType, string> = {
  unassign: "Shift unassigned",
  cancel: "Shift cancelled",
  reinstate: "Shift reinstated",
  delete: "Shift deleted",
};

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unassigned", label: "Unassigned" },
  { value: "assigned", label: "Assigned" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const isTab = (value: string | null): value is Tab =>
  value === "roster" || value === "swaps" || value === "leave";

const isStatusFilter = (value: string | null): value is StatusFilter =>
  statusOptions.some((o) => o.value === value);

const formatWeekRange = (start: Date, end: Date) => {
  const short = { weekday: "short", day: "numeric", month: "short" } as const;
  return `${start.toLocaleDateString("en-AU", short)} – ${end.toLocaleDateString("en-AU", { ...short, year: "numeric" })}`;
};

export const AdminShifts = () => {
  const { activeModal, setActiveModal } = useUser();
  // ?tab=swaps / ?tab=roster&status=unassigned, e.g. from the dashboard cards
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get("tab");
    return isTab(t) ? t : "roster";
  });

  // Keep the tab in the URL (replace, so Back still goes to the dashboard).
  const changeTab = (t: Tab) => {
    setTab(t);
    setSearchParams({ tab: t }, { replace: true });
  };
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [shifts, setShifts] = useState<IShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Shifts only store ids, so load clients and workers for names.
  const [clientNames, setClientNames] = useState<Map<string, string>>(
    new Map(),
  );
  const [workers, setWorkers] = useState<IUser[]>([]);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    const s = searchParams.get("status");
    return isStatusFilter(s) ? s : "all";
  });
  const [workerFilter, setWorkerFilter] = useState("all"); // "all" | "unassigned" | worker id

  // Row actions
  const [editingShift, setEditingShift] = useState<IShift | null>(null);
  const [assigningShift, setAssigningShift] = useState<IShift | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  // Swap requests: loaded with the page so the tab can show a count.
  const [swaps, setSwaps] = useState<ISwapRequest[]>([]);
  const [isSwapsLoading, setIsSwapsLoading] = useState(true);
  const [swapsReloadKey, setSwapsReloadKey] = useState(0);
  const needsReviewCount = swaps.filter(
    (s) => s.status === "workerAccepted",
  ).length;

  // Leave requests: same idea as swaps.
  const [leaves, setLeaves] = useState<ILeaveRequest[]>([]);
  const [isLeavesLoading, setIsLeavesLoading] = useState(true);
  const [leavesReloadKey, setLeavesReloadKey] = useState(0);
  const pendingLeaveCount = leaves.filter((l) => l.status === "pending").length;

  const [cancelReason, setCancelReason] = useState("");
  const [reinstateUnassigned, setReinstateUnassigned] = useState(false);

  const openConfirm = (type: ConfirmType, shift: IShift) => {
    setCancelReason("");
    setReinstateUnassigned(false);
    setConfirmAction({ type, shift });
  };

  const weekEnd = addDays(weekStart, 6);
  const from = toDateInputValue(weekStart);
  const to = toDateInputValue(weekEnd);

  const workerNames = new Map(workers.map((w) => [w._id, w.name]));
  const activeWorkers = workers.filter((w) => w.status === "active");

  // Names: load once
  useEffect(() => {
    let ignore = false;

    Promise.all([getAllClients(), getAllUsers()]).then(
      ([clientRes, userRes]) => {
        if (ignore) return;
        if (clientRes.status === "success") {
          setClientNames(
            new Map(clientRes.clients.map((c) => [c._id, c.name])),
          );
        } else {
          toast.error(clientRes.message);
        }
        if (userRes.status === "success") {
          setWorkers(userRes.allUsers.filter((u) => u.role === "worker"));
        } else {
          toast.error(userRes.message);
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, []);

  // Shifts: load the selected week (and again after any change)
  useEffect(() => {
    let ignore = false;

    getShifts({ from, to }).then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setShifts(res.allShifts);
      } else {
        setShifts([]);
        toast.error(res.message);
      }
      setIsLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [from, to, reloadKey]);

  // Swap requests (all statuses; the tab filters them)
  useEffect(() => {
    let ignore = false;

    getSwapRequests().then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setSwaps(res.swapRequests);
      } else {
        toast.error(res.message);
      }
      setIsSwapsLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [swapsReloadKey]);

  // Leave requests
  useEffect(() => {
    let ignore = false;

    getLeaveRequests().then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setLeaves(res.leaveRequests);
      } else {
        toast.error(res.message);
      }
      setIsLeavesLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [leavesReloadKey]);

  // Approving leave can unassign shifts, so reload the roster too.
  const handleLeavesChanged = () => {
    setLeavesReloadKey((k) => k + 1);
    setReloadKey((k) => k + 1);
  };

  // An approved swap changes who works each shift, so reload both.
  const handleSwapsChanged = () => {
    setSwapsReloadKey((k) => k + 1);
    setReloadKey((k) => k + 1);
  };

  const changeWeek = (newStart: Date) => {
    setIsLoading(true);
    setWeekStart(newStart);
  };

  const reloadShifts = () => setReloadKey((k) => k + 1);

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { type, shift } = confirmAction;

    const res =
      type === "delete"
        ? await deleteShifts([shift._id])
        : type === "cancel"
          ? await cancelShift(shift._id, cancelReason.trim())
          : type === "reinstate"
            ? await reinstateShift(shift._id, reinstateUnassigned)
            : await updateShift(shift._id, { workerId: null });

    if (res.status !== "success") {
      toast.error(res.message);
      return;
    }

    toast.success(successMessages[type]);
    setConfirmAction(null);
    reloadShifts();
  };

  const filteredShifts = shifts.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (workerFilter === "unassigned") return !s.workerId;
    if (workerFilter !== "all") return s.workerId === workerFilter;
    return true;
  });

  // Cancelled shifts are listed but don't count towards the totals.
  const activeShifts = filteredShifts.filter((s) => s.status !== "cancelled");
  const cancelledCount = filteredShifts.length - activeShifts.length;
  const unassignedCount = activeShifts.filter((s) => !s.workerId).length;
  const totalHours = activeShifts.reduce((sum, s) => sum + s.totalHours, 0);

  const workerName = (id: string | null) =>
    id ? (workerNames.get(id) ?? "Unknown") : "";

  const columns: Column<IShift>[] = [
    { header: "Date", render: (s) => formatShiftDate(s.date) },
    {
      header: "Time",
      render: (s) => (
        <>
          {s.startTime}–{s.endTime}
          {s.endTime < s.startTime && (
            <span className="mutedDate" title="Overnight">
              {" "}
              ☾
            </span>
          )}
        </>
      ),
    },
    { header: "Hours", render: (s) => s.totalHours },
    {
      header: "Client",
      render: (s) => clientNames.get(s.clientId) ?? "Unknown",
    },
    { header: "Location", render: (s) => s.location },
    {
      header: "Worker",
      render: (s) =>
        s.workerId ? (
          workerName(s.workerId)
        ) : (
          <span className="mutedDate">Unassigned</span>
        ),
    },
    {
      header: "Status",
      render: (s) => (
        <span
          className={`shiftStatus ${s.status}`}
          title={s.cancelReason ? `Reason: ${s.cancelReason}` : undefined}
        >
          {s.status}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (s) => (
        <Dropdown align="end">
          <Dropdown.Toggle
            size="sm"
            variant="outline-light"
            aria-label="Shift actions"
          >
            ⋯
          </Dropdown.Toggle>
          {/* fixed strategy so the menu isn't clipped by the scrolling table */}
          <Dropdown.Menu popperConfig={{ strategy: "fixed" }}>
            {/* Active shifts: assign/unassign, edit, cancel */}
            {(s.status === "assigned" || s.status === "unassigned") && (
              <>
                {s.workerId ? (
                  <Dropdown.Item onClick={() => openConfirm("unassign", s)}>
                    Unassign
                  </Dropdown.Item>
                ) : (
                  <Dropdown.Item onClick={() => setAssigningShift(s)}>
                    Assign worker
                  </Dropdown.Item>
                )}
                <Dropdown.Item onClick={() => setEditingShift(s)}>
                  Edit
                </Dropdown.Item>
                <Dropdown.Item onClick={() => openConfirm("cancel", s)}>
                  Cancel shift
                </Dropdown.Item>
                <Dropdown.Divider />
              </>
            )}
            {s.status === "cancelled" && (
              <>
                <Dropdown.Item onClick={() => openConfirm("reinstate", s)}>
                  Reinstate
                </Dropdown.Item>
                <Dropdown.Divider />
              </>
            )}
            {/* Completed shifts are read-only apart from delete */}
            <Dropdown.Item
              className="text-danger"
              onClick={() => openConfirm("delete", s)}
            >
              Delete
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      ),
    },
  ];

  const renderRoster = () => (
    <>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <Button
          size="sm"
          variant="outline-light"
          onClick={() => changeWeek(addDays(weekStart, -7))}
          aria-label="Previous week"
        >
          ◀
        </Button>
        <span className="px-2">{formatWeekRange(weekStart, weekEnd)}</span>
        <Button
          size="sm"
          variant="outline-light"
          onClick={() => changeWeek(addDays(weekStart, 7))}
          aria-label="Next week"
        >
          ▶
        </Button>
        <Button
          size="sm"
          variant="outline-light"
          onClick={() => changeWeek(startOfWeek(new Date()))}
        >
          This week
        </Button>

        <div className="d-flex gap-2 ms-auto">
          <Form.Select
            size="sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filter by status"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                Status: {o.label}
              </option>
            ))}
          </Form.Select>
          <Form.Select
            size="sm"
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
            aria-label="Filter by worker"
          >
            <option value="all">Worker: All</option>
            <option value="unassigned">Worker: Unassigned</option>
            {workers.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
        </div>
      ) : filteredShifts.length === 0 ? (
        <p className="mutedDate text-center my-5">No shifts this week.</p>
      ) : (
        <>
          {/* key resets to page 1 when the week or filters change */}
          <div key={`${from}-${statusFilter}-${workerFilter}`}>
            <DataTable
              columns={columns}
              rows={filteredShifts}
              getKey={(s) => s._id}
              getRowClassName={(s) =>
                s.status === "cancelled" ? "cancelledRow" : undefined
              }
            />
          </div>
          <p className="mutedDate mt-2">
            {activeShifts.length} shifts · {unassignedCount} unassigned
            {cancelledCount > 0 && ` · ${cancelledCount} cancelled`} ·{" "}
            {Number(totalHours.toFixed(2))} h rostered
          </p>
        </>
      )}
    </>
  );

  const confirmShift = confirmAction?.shift;
  const confirmWhen = confirmShift
    ? `${formatShiftDate(confirmShift.date)}, ${confirmShift.startTime}–${confirmShift.endTime}`
    : "";
  const confirmWorker = workerName(confirmShift?.workerId ?? null);
  const forWorker = confirmWorker ? ` for ${confirmWorker}` : "";

  // Title, message, button and colour for each kind of confirmation.
  const confirmContent: Record<
    ConfirmType,
    {
      title: string;
      message: ReactNode;
      label: string;
      variant: "primary" | "danger";
    }
  > = {
    unassign: {
      title: "Unassign shift",
      message: (
        <>
          Unassign {confirmWorker} from the shift on {confirmWhen}?
        </>
      ),
      label: "Unassign",
      variant: "primary",
    },
    cancel: {
      title: "Cancel shift",
      message: (
        <>
          <p>
            Cancel the shift on {confirmWhen}
            {forWorker}? It stays in the roster as cancelled and can be
            reinstated later.
          </p>
          <Form.Group controlId="cancelReason">
            <Form.Label>Reason (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              maxLength={500}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </Form.Group>
        </>
      ),
      label: "Cancel shift",
      variant: "danger",
    },
    reinstate: {
      title: "Reinstate shift",
      message: (
        <>
          <p>
            Reinstate the shift on {confirmWhen}
            {forWorker}?
            {confirmShift?.workerId &&
              " Their availability and other shifts are checked again first."}
          </p>
          {confirmShift?.workerId && (
            <Form.Check
              id="reinstateUnassigned"
              type="checkbox"
              label="Reinstate without a worker (unassigned)"
              checked={reinstateUnassigned}
              onChange={(e) => setReinstateUnassigned(e.target.checked)}
            />
          )}
        </>
      ),
      label: "Reinstate",
      variant: "primary",
    },
    delete: {
      title: "Delete shift",
      message: <>Delete the shift on {confirmWhen}? This can't be undone.</>,
      label: "Delete",
      variant: "danger",
    },
  };
  const confirm = confirmAction ? confirmContent[confirmAction.type] : null;

  return (
    <div className="layoutWrapper p-3">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Link to="/admin" className="backLink">
            ← Back to dashboard
          </Link>
          <Button onClick={() => setActiveModal("createShift")}>
            <IoMdAdd /> Create Shift
          </Button>
        </div>

        <div className="title mb-3">Shifts</div>

        <div className="d-flex gap-2 mb-3">
          <Button
            variant={tab === "roster" ? "primary" : "outline-light"}
            onClick={() => changeTab("roster")}
          >
            Roster
          </Button>
          <Button
            variant={tab === "swaps" ? "primary" : "outline-light"}
            onClick={() => changeTab("swaps")}
          >
            Swap requests{needsReviewCount > 0 && ` (${needsReviewCount})`}
          </Button>
          <Button
            variant={tab === "leave" ? "primary" : "outline-light"}
            onClick={() => changeTab("leave")}
          >
            Leave requests{pendingLeaveCount > 0 && ` (${pendingLeaveCount})`}
          </Button>
        </div>

        <div className="mainScreenSection">
          {tab === "roster" && renderRoster()}
          {tab === "swaps" && (
            <SwapRequestsTab
              swaps={swaps}
              isLoading={isSwapsLoading}
              clientNames={clientNames}
              onChanged={handleSwapsChanged}
            />
          )}
          {tab === "leave" && (
            <LeaveRequestsTab
              leaves={leaves}
              isLoading={isLeavesLoading}
              clientNames={clientNames}
              onChanged={handleLeavesChanged}
            />
          )}
        </div>

        {/* Create */}
        <AppModal
          show={activeModal === "createShift"}
          onClose={() => setActiveModal(null)}
          title="Create Shift"
        >
          <ShiftForm onSaved={reloadShifts} />
        </AppModal>

        {/* Edit */}
        <AppModal
          show={editingShift !== null}
          onClose={() => setEditingShift(null)}
          title="Edit Shift"
        >
          {editingShift && (
            <ShiftForm
              key={editingShift._id}
              shift={editingShift}
              onSaved={() => {
                setEditingShift(null);
                reloadShifts();
              }}
            />
          )}
        </AppModal>

        {/* Assign */}
        <AssignWorkerModal
          shift={assigningShift}
          workers={activeWorkers}
          onClose={() => setAssigningShift(null)}
          onAssigned={() => {
            setAssigningShift(null);
            reloadShifts();
          }}
        />

        {/* Unassign / Cancel / Reinstate / Delete */}
        <ConfirmModal
          show={confirmAction !== null}
          title={confirm?.title ?? ""}
          message={confirm?.message}
          confirmLabel={confirm?.label}
          variant={confirm?.variant}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      </Container>
    </div>
  );
};
