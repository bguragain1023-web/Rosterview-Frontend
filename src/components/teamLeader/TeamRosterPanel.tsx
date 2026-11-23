import { useEffect, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { IoMdAdd } from "react-icons/io";
import { toast } from "react-toastify";
import {
  cancelShift,
  getAllClients,
  getShifts,
  getTeamDetail,
  type IShift,
} from "../../helper/axios";
import { useUser } from "../../contex/UserContext";
import { AppModal } from "../custom/AppModal";
import { ConfirmModal } from "../custom/ConfirmModal";
import { DataTable, type Column } from "../custom/DataTable";
import { ShiftForm, type WorkerOption } from "../forms/ShiftForm";
import { AssignWorkerModal } from "../shifts/AssignWorkerModal";
import {
  addDays,
  formatShiftDate,
  startOfWeek,
  toDateInputValue,
} from "../../utils/dates";

const formatWeekRange = (start: Date, end: Date) => {
  const short = { weekday: "short", day: "numeric", month: "short" } as const;
  return `${start.toLocaleDateString("en-AU", short)} – ${end.toLocaleDateString("en-AU", { ...short, year: "numeric" })}`;
};

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
    header: "Worker",
    render: (s) =>
      s.workerId ? (
        (s.workerName ?? "Unknown")
      ) : (
        <span className="mutedDate">Unassigned</span>
      ),
  },
  { header: "Client", render: (s) => s.clientName ?? "Unknown" },
  { header: "Location", render: (s) => s.location },
  {
    header: "Status",
    render: (s) => (
      <span className={`shiftStatus ${s.status}`}>{s.status}</span>
    ),
  },
];

// A team leader's area roster: their clients' shifts (incl. unassigned) and
// their members' shifts. They can create, assign, edit and cancel shifts for
// their own area's clients; the backend checks this too.
export const TeamRosterPanel = () => {
  const { user } = useUser();
  const teamId = user?.teamId;

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [shifts, setShifts] = useState<IShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  // My team's workers, in the shape ShiftForm / AssignWorkerModal want.
  const [members, setMembers] = useState<WorkerOption[]>([]);
  // My area's clients (for a team leader the backend only returns those).
  const [areaClientIds, setAreaClientIds] = useState<Set<string>>(new Set());

  // Which dialog is open (null / false = none)
  const [isCreating, setIsCreating] = useState(false);
  const [editingShift, setEditingShift] = useState<IShift | null>(null);
  const [assigningShift, setAssigningShift] = useState<IShift | null>(null);
  const [cancellingShift, setCancellingShift] = useState<IShift | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const from = toDateInputValue(weekStart);
  const to = toDateInputValue(weekEnd);

  // Load once: team members and area clients.
  useEffect(() => {
    if (!teamId) return;
    let ignore = false;

    Promise.all([getTeamDetail(teamId), getAllClients()]).then(
      ([teamRes, clientRes]) => {
        if (ignore) return;
        if (teamRes.status === "success") {
          setMembers(
            teamRes.team.members
              .filter((m) => m.role === "worker")
              .map((m) => ({ ...m, role: "worker", teamId })),
          );
        } else {
          toast.error(teamRes.message);
        }
        if (clientRes.status === "success") {
          setAreaClientIds(new Set(clientRes.clients.map((c) => c._id)));
        } else {
          toast.error(clientRes.message);
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, [teamId]);

  // Shifts for the selected week (and again after any change)
  useEffect(() => {
    let ignore = false;

    getShifts({ from, to }).then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setShifts(
          [...res.allShifts].sort(
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
  }, [from, to, reloadKey]);

  const changeWeek = (newStart: Date) => {
    setIsLoading(true);
    setWeekStart(newStart);
  };

  // I can act on a shift if its client is in my area and it's still active.
  const canManage = (s: IShift) =>
    areaClientIds.has(s.clientId) &&
    (s.status === "assigned" || s.status === "unassigned");

  const actionsColumn: Column<IShift> = {
    header: "Actions",
    render: (s) =>
      canManage(s) ? (
        <div className="d-flex gap-2">
          {s.status === "unassigned" && (
            <Button size="sm" onClick={() => setAssigningShift(s)}>
              Assign
            </Button>
          )}
          <Button
            size="sm"
            variant="outline-light"
            onClick={() => setEditingShift(s)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline-danger"
            onClick={() => setCancellingShift(s)}
          >
            Cancel
          </Button>
        </div>
      ) : null,
  };
  const tableColumns = [...columns, actionsColumn];

  const handleCancel = async () => {
    if (!cancellingShift) return;
    const res = await cancelShift(cancellingShift._id);
    toast[res.status](res.message);
    setCancellingShift(null);
    reload();
  };

  const activeShifts = shifts.filter((s) => s.status !== "cancelled");
  const unassignedCount = shifts.filter(
    (s) => s.status === "unassigned",
  ).length;
  const totalHours = activeShifts.reduce((sum, s) => sum + s.totalHours, 0);

  return (
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
        <Button
          size="sm"
          className="ms-auto"
          onClick={() => setIsCreating(true)}
        >
          <IoMdAdd /> Create shift
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
        </div>
      ) : shifts.length === 0 ? (
        <p className="mutedDate text-center my-5">No team shifts this week.</p>
      ) : (
        <>
          {/* key resets to page 1 when the week changes */}
          <div key={from}>
            <DataTable
              columns={tableColumns}
              rows={shifts}
              getKey={(s) => s._id}
              getRowClassName={(s) =>
                s.status === "cancelled" ? "cancelledRow" : undefined
              }
            />
          </div>
          <p className="mutedDate mt-2">
            {activeShifts.length} shifts · {unassignedCount} unassigned ·{" "}
            {Number(totalHours.toFixed(2))} h rostered
          </p>
        </>
      )}

      <AppModal
        show={isCreating}
        onClose={() => setIsCreating(false)}
        title="Create shift"
      >
        {isCreating && (
          <ShiftForm
            workers={members}
            onSaved={() => {
              setIsCreating(false);
              reload();
            }}
          />
        )}
      </AppModal>

      <AppModal
        show={editingShift !== null}
        onClose={() => setEditingShift(null)}
        title="Edit shift"
      >
        {editingShift && (
          <ShiftForm
            key={editingShift._id}
            shift={editingShift}
            workers={members}
            onSaved={() => {
              setEditingShift(null);
              reload();
            }}
          />
        )}
      </AppModal>

      <AssignWorkerModal
        shift={assigningShift}
        workers={members.filter((m) => m.status === "active")}
        onClose={() => setAssigningShift(null)}
        onAssigned={() => {
          setAssigningShift(null);
          reload();
        }}
      />

      <ConfirmModal
        show={cancellingShift !== null}
        title="Cancel shift"
        message={
          cancellingShift
            ? `Cancel the shift on ${formatShiftDate(cancellingShift.date)}, ${cancellingShift.startTime}–${cancellingShift.endTime}?`
            : ""
        }
        confirmLabel="Yes, cancel shift"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setCancellingShift(null)}
      />
    </>
  );
};
