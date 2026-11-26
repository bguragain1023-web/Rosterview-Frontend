import { SlPeople } from "react-icons/sl";
import { SlCalender } from "react-icons/sl";
import { IoMdAdd } from "react-icons/io";
import { useUser } from "../contex/UserContext";
import { AppModal } from "../components/custom/AppModal";
import { AddStaffForm } from "../components/forms/AddStaffForm";
import { AddClientForm } from "../components/forms/AddClientForm";
import { CreateTeamForm } from "../components/forms/CreateTeamForm";
import { ShiftForm } from "../components/forms/ShiftForm";
import { useEffect, useState, type ReactNode } from "react";
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
import { Button, Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { EditClientForm } from "../components/clients/EditClientForm";

type TableName = "staff" | "client" | "team";

// null = couldn't load
interface AttentionCounts {
  unassigned: number | null;
  swaps: number | null;
  leave: number | null;
}

export const Admin = () => {
  const [showTable, setShowTable] = useState<TableName>("staff");
  const [staffList, setStaffList] = useState<IUser[]>([]);
  const [clientList, setClientList] = useState<IClient[]>([]);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  const { setActiveModal, activeModal, user } = useUser();
  const closeModal = () => setActiveModal(null);
  const navigate = useNavigate();

  const handleOnView = (id: string) => navigate(`/admin/staff/${id}`);

  // The client whose Edit modal is open (null = closed).
  const [editingClient, setEditingClient] = useState<IClient | null>(null);

  // After an edit, fetch the clients again so the table shows the change.
  const reloadClients = async () => {
    const res = await getAllClients();
    if (res.status === "success") setClientList(res.clients);
    else toast.error(res.message);
  };

  // "Needs attention" counts
  const [attention, setAttention] = useState<AttentionCounts | null>(null); // null = loading
  const [attentionReloadKey, setAttentionReloadKey] = useState(0);

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
      to: "/admin/shifts?tab=roster&status=unassigned",
    },
    {
      key: "swaps",
      label: "Swap requests to review",
      tone: "cyan",
      to: "/admin/shifts?tab=swaps",
    },
    {
      key: "leave",
      label: "Leave requests pending",
      tone: "orange",
      to: "/admin/shifts?tab=leave",
    },
  ];

  const staffColumns: Column<IUser>[] = [
    {
      header: "Name",
      render: (u) => u.name,
    },
    // On phones only Name, Role and View show; View opens the full details.
    { header: "Email", render: (u) => u.email, hideOnMobile: true },
    { header: "Phone", render: (u) => u.phone, hideOnMobile: true },
    { header: "Role", render: (u) => u.role },
    {
      header: "Team",
      render: (u) =>
        teamList.find((t) => t._id === u.teamId)?.name ?? "Unassigned",
      hideOnMobile: true,
    },
    { header: "Status", render: (u) => u.status, hideOnMobile: true },
    {
      header: "Action",
      render: (u) => (
        <Button
          size="sm"
          variant="outline-light"
          onClick={() => handleOnView(u._id)}
        >
          View
        </Button>
      ),
    },
  ];

  const clientColumns: Column<IClient>[] = [
    // On phones only Name, Team and Edit show; Edit opens the full details.
    { header: "Name", render: (c) => c.name },
    { header: "Email", render: (c) => c.email, hideOnMobile: true },
    { header: "Phone", render: (c) => c.phone, hideOnMobile: true },
    { header: "Address", render: (c) => c.address, hideOnMobile: true },
    {
      header: "Team",
      render: (c) =>
        teamList.find((t) => t._id === c.teamId)?.name ?? (
          <span className="mutedDate">No team</span>
        ),
    },
    {
      header: "Status",
      render: (c) => (c.isActive ? "active" : "inactive"),
      hideOnMobile: true,
    },
    {
      header: "Action",
      render: (c) => (
        <Button
          size="sm"
          variant="outline-light"
          onClick={() => setEditingClient(c)}
        >
          Edit
        </Button>
      ),
    },
  ];

  const teamColumns: Column<ITeam>[] = [
    { header: "Name", render: (t) => t.name },
    {
      header: "Team Leader",
      render: (t) =>
        staffList.find((u) => u._id === t.teamLeaderId)?.name ?? "Unassigned",
    },
    { header: "Description", render: (t) => t.description, hideOnMobile: true },
    {
      header: "Action",
      render: (t) => (
        <Button
          size="sm"
          variant="outline-light"
          onClick={() => navigate(`/admin/teams/${t._id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  const modals = {
    addStaff: { title: "Add New Staff", body: <AddStaffForm /> },
    updateStaff: { title: "Update Staff Detail", body: <>Comming soon</> },
    createShift: {
      title: "Create Shift",
      // a new unassigned shift changes the "Needs attention" count
      body: <ShiftForm onSaved={() => setAttentionReloadKey((k) => k + 1)} />,
    },
    createTeam: {
      title: "Create Team",
      body: <CreateTeamForm />,
    },
    addClient: { title: "Add New Client ", body: <AddClientForm /> },
  };
  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Shown in each table's top row, left of the search box.
  const tableButtons = (
    <>
      <Button onClick={() => setShowTable("staff")}>Staff</Button>
      <Button onClick={() => setShowTable("client")}>Clients</Button>
      <Button onClick={() => setShowTable("team")}>Teams</Button>
    </>
  );

  const tables: Record<TableName, ReactNode> = {
    staff: (
      <DataTable
        columns={staffColumns}
        rows={staffList}
        getKey={(u) => u.email}
        getSearchText={(u) => u.name}
        toolbar={tableButtons}
      />
    ),
    client: (
      <DataTable
        columns={clientColumns}
        rows={clientList}
        getKey={(c) => c.phone}
        getSearchText={(c) => c.name}
        toolbar={tableButtons}
      />
    ),

    team: (
      <DataTable
        columns={teamColumns}
        rows={teamList}
        getKey={(t) => t._id}
        getSearchText={(t) => t.name}
        toolbar={tableButtons}
      />
    ),
  };

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

  return (
    <div className="layoutWrapper p-3">
      <Container className="pageContainer">
        <Row>
          <Col>
            <div className="title"> {user?.name}</div>
            <span className="mutedDate">{user?.role.toUpperCase()}</span>
            <br />
            <span className="mutedDate">{today}</span>
          </Col>
        </Row>

        <div className="mainScreen">
          <div className="mainScreenSection d-flex gap-2 p-1 mt-3 flex-wrap">
            <div className="staffDetail justify-content-center  d-flex align-items-center gap-3  ">
              <div className="staffDetailIcon">
                <SlPeople />
              </div>
              <div>
                <div className="total"> Total Staff</div>
                <hr />
                <span>{staffList.length}</span>
              </div>
            </div>

            <div className="staffDetail justify-content-center  d-flex align-items-center gap-3  ">
              <div className="staffDetailIcon">
                <SlPeople />
              </div>
              <div>
                <div className="total"> Total Team</div>
                <hr />
                <span>{teamList.length}</span>
              </div>
            </div>

            <div className="staffDetail justify-content-center  d-flex align-items-center gap-3  ">
              <div className="staffDetailIcon">
                <SlPeople />
              </div>
              <div>
                <div className="total"> Total Clients</div>
                <hr />
                <span> {clientList.length} </span>
              </div>
            </div>

            <div className="staffDetail justify-content-center  d-flex align-items-center gap-3  ">
              <div className="staffDetailIcon">
                <SlPeople />
              </div>
              <div>
                <div className="total">Coordinators and Leaders</div>
                <hr />
                <span>
                  {
                    staffList.filter(
                      (u) =>
                        u.role === "coordinator" || u.role === "teamLeader",
                    ).length
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="mainScreenSection mt-5">
            <div className="subtitle">Quick Actions</div>
            <div className="quickActions d-flex flex-wrap gap-3 mt-3">
              <div
                className="quickActionMenu text-info"
                onClick={() => setActiveModal("addStaff")}
              >
                {" "}
                <IoMdAdd /> Add New Staff
              </div>

              <div
                className="quickActionMenu text-warning "
                onClick={() => setActiveModal("addClient")}
              >
                {" "}
                <IoMdAdd /> Add New Client
              </div>

              <div
                className="quickActionMenu text-success"
                onClick={() => setActiveModal("createShift")}
              >
                <IoMdAdd /> Create Shift
              </div>
              <div
                className="quickActionMenu"
                onClick={() => navigate("/admin/shifts")}
              >
                <SlCalender /> View Roster
              </div>
              <div
                className="quickActionMenu"
                onClick={() => setActiveModal("createTeam")}
              >
                Create Team
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
            show={activeModal !== null}
            onClose={closeModal}
            title={activeModal ? modals[activeModal].title : ""}
          >
            {activeModal && modals[activeModal].body}
          </AppModal>

          <AppModal
            show={editingClient !== null}
            onClose={() => setEditingClient(null)}
            title="Edit client"
          >
            {editingClient && (
              <EditClientForm
                key={editingClient._id}
                client={editingClient}
                onCancel={() => setEditingClient(null)}
                onSaved={() => {
                  setEditingClient(null);
                  reloadClients();
                }}
              />
            )}
          </AppModal>

          <div className="mainScreenSection mt-4">
            {/* key resets DataTable (page and search) when you switch tables */}
            <div key={showTable}>{tables[showTable]}</div>
          </div>
        </div>
      </Container>
    </div>
  );
};
