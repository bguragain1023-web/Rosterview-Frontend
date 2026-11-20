import { SlPeople, SlCalender } from "react-icons/sl";
import { IoMdAdd } from "react-icons/io";
import { useEffect, useState, type ReactNode } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../contex/UserContext";
import { AppModal } from "../components/custom/AppModal";
import { ShiftForm } from "../components/forms/ShiftForm";
import { DataTable, type Column } from "../components/custom/DataTable";
import {
  getAllClients,
  getAllTeams,
  getAllUsers,
  getLeaveRequests,
  getShifts,
  getSwapRequests,
  type IClient,
  type ITeam,
  type IUser,
} from "../helper/axios";
import { addDays, startOfWeek, toDateInputValue } from "../utils/dates";

type TableName = "staff" | "client" | "team";

// null = couldn't load
interface AttentionCounts {
  unassigned: number | null;
  swaps: number | null;
  leave: number | null;
}

const attentionCards: {
  key: keyof AttentionCounts;
  label: string;
  tone: "orange" | "cyan";
  to: string;
}[] = [
  {
    key: "unassigned",
    label: "Unassigned shifts this week",
    tone: "orange",
    to: "/coordinator/shifts?tab=roster&status=unassigned",
  },
  {
    key: "swaps",
    label: "Swap requests to review",
    tone: "cyan",
    to: "/coordinator/shifts?tab=swaps",
  },
  {
    key: "leave",
    label: "Leave requests pending",
    tone: "orange",
    to: "/coordinator/shifts?tab=leave",
  },
];

// A coordinator can view staff, clients and teams, but not add or edit them.
// Their work is the roster, leave and swaps (all on /coordinator/shifts).
export const Coordinator = () => {
  const { user, activeModal, setActiveModal } = useUser();
  const navigate = useNavigate();

  const [showTable, setShowTable] = useState<TableName>("staff");
  const [staffList, setStaffList] = useState<IUser[]>([]);
  const [clientList, setClientList] = useState<IClient[]>([]);
  const [teamList, setTeamList] = useState<ITeam[]>([]);

  // "Needs attention" counts
  const [attention, setAttention] = useState<AttentionCounts | null>(null); // null = loading
  const [attentionReloadKey, setAttentionReloadKey] = useState(0);

  // Load staff, clients and teams together.
  useEffect(() => {
    let ignore = false;

    Promise.all([getAllUsers(), getAllClients(), getAllTeams()]).then(
      ([userRes, clientRes, teamRes]) => {
        if (ignore) return;
        if (userRes.status === "success") setStaffList(userRes.allUsers);
        else toast.error(userRes.message);

        if (clientRes.status === "success") setClientList(clientRes.clients);
        else toast.error(clientRes.message);

        if (teamRes.status === "success") setTeamList(teamRes.teams);
        else toast.error(teamRes.message);
      },
    );

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    // Same Monday–Sunday week the roster opens on, so the numbers match.
    const weekStart = startOfWeek(new Date());

    Promise.all([
      getShifts({
        from: toDateInputValue(weekStart),
        to: toDateInputValue(addDays(weekStart, 6)),
      }),
      getSwapRequests(["workerAccepted"]),
      getLeaveRequests(),
    ]).then(([shiftRes, swapRes, leaveRes]) => {
      if (ignore) return;
      setAttention({
        unassigned:
          shiftRes.status === "success"
            ? shiftRes.allShifts.filter((s) => s.status === "unassigned").length
            : null,
        swaps:
          swapRes.status === "success" ? swapRes.swapRequests.length : null,
        leave:
          leaveRes.status === "success"
            ? leaveRes.leaveRequests.filter((l) => l.status === "pending")
                .length
            : null,
      });
    });

    return () => {
      ignore = true;
    };
  }, [attentionReloadKey]);

  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const staffColumns: Column<IUser>[] = [
    { header: "Name", render: (u) => u.name },
    { header: "Email", render: (u) => u.email },
    { header: "Phone", render: (u) => u.phone },
    { header: "Role", render: (u) => u.role },
    {
      header: "Team",
      render: (u) =>
        teamList.find((t) => t._id === u.teamId)?.name ?? "Unassigned",
    },
    { header: "Status", render: (u) => u.status },
    {
      header: "Action",
      render: (u) => (
        <Button
          size="sm"
          variant="outline-light"
          onClick={() => navigate(`/coordinator/staff/${u._id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  const clientColumns: Column<IClient>[] = [
    { header: "Name", render: (c) => c.name },
    { header: "Email", render: (c) => c.email },
    { header: "Phone", render: (c) => c.phone },
    { header: "Address", render: (c) => c.address },
    { header: "Status", render: (c) => (c.isActive ? "active" : "inactive") },
  ];

  const teamColumns: Column<ITeam>[] = [
    { header: "Name", render: (t) => t.name },
    {
      header: "Team Leader",
      render: (t) =>
        staffList.find((u) => u._id === t.teamLeaderId)?.name ?? "Unassigned",
    },
    { header: "Description", render: (t) => t.description },
    {
      header: "Action",
      render: (t) => (
        <Button
          size="sm"
          variant="outline-light"
          onClick={() => navigate(`/coordinator/teams/${t._id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  const tables: Record<TableName, ReactNode> = {
    staff: (
      <DataTable
        columns={staffColumns}
        rows={staffList}
        getKey={(u) => u._id}
      />
    ),
    client: (
      <DataTable
        columns={clientColumns}
        rows={clientList}
        getKey={(c) => c.phone}
      />
    ),
    team: (
      <DataTable columns={teamColumns} rows={teamList} getKey={(t) => t._id} />
    ),
  };

  const countBoxes = [
    { label: "Total Staff", value: staffList.length },
    { label: "Total Teams", value: teamList.length },
    { label: "Total Clients", value: clientList.length },
  ];

  return (
    <div className="layoutWrapper p-3">
      <Container>
        <Row>
          <Col>
            <div className="title">Welcome {user?.name}</div>
            <span className="mutedDate">{user?.role?.toUpperCase()}</span>
            <br />
            <span className="mutedDate">{today}</span>
          </Col>
        </Row>

        <div className="mainScreen">
          <div className="mainScreenSection d-flex gap-2 p-1 mt-3 flex-wrap">
            {countBoxes.map((box) => (
              <div
                key={box.label}
                className="staffDetail justify-content-center d-flex align-items-center gap-3"
              >
                <div className="staffDetailIcon">
                  <SlPeople />
                </div>
                <div>
                  <div className="total">{box.label}</div>
                  <hr />
                  <span>{box.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mainScreenSection mt-5">
            <div className="subtitle">Quick Actions</div>
            <div className="quickActions d-flex gap-3 mt-3">
              <div
                className="quickActionMenu text-success"
                onClick={() => setActiveModal("createShift")}
              >
                <IoMdAdd /> Create Shift
              </div>
              <div
                className="quickActionMenu"
                onClick={() => navigate("/coordinator/shifts")}
              >
                <SlCalender /> View Roster
              </div>
            </div>
          </div>

          <div className="mainScreenSection mt-5">
            <div className="subtitle">Needs attention</div>
            <div className="d-flex gap-3 mt-3 flex-wrap">
              {attentionCards.map((card) => {
                const count = attention ? attention[card.key] : undefined;
                const isClear = count === 0;
                return (
                  <button
                    key={card.key}
                    type="button"
                    className={`attentionCard ${count ? card.tone : "clear"}`}
                    onClick={() => navigate(card.to)}
                  >
                    <span className="attentionCount">
                      {count === undefined ? "…" : count === null ? "—" : count}
                    </span>
                    <span className="attentionLabel">
                      {card.label}
                      {isClear && (
                        <span className="mutedDate d-block">All clear</span>
                      )}
                    </span>
                    <span className="attentionArrow">→</span>
                  </button>
                );
              })}
            </div>
          </div>

          <AppModal
            show={activeModal === "createShift"}
            onClose={() => setActiveModal(null)}
            title="Create Shift"
          >
            {/* a new unassigned shift changes the "Needs attention" count */}
            <ShiftForm onSaved={() => setAttentionReloadKey((k) => k + 1)} />
          </AppModal>

          <div className="mainScreenSection mt-4">
            <div className="d-flex gap-2 mb-3">
              <Button onClick={() => setShowTable("staff")}>Staff</Button>
              <Button onClick={() => setShowTable("client")}>Clients</Button>
              <Button onClick={() => setShowTable("team")}>Teams</Button>
            </div>

            {/* key resets DataTable to page 1 when you switch tables */}
            <div key={showTable}>{tables[showTable]}</div>
          </div>
        </div>
      </Container>
    </div>
  );
};
