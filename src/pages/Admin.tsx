import { MdOutlineDashboard } from "react-icons/md";
import { SlPeople } from "react-icons/sl";
import { RiTeamLine } from "react-icons/ri";
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
  const [loadError, setLoadError] = useState("");
  const { setActiveModal, activeModal, user } = useUser();
  const closeModal = () => setActiveModal(null);
  const navigate = useNavigate();

  // The detail page loads the user by id, so nothing needs passing along.
  const handleOnView = (id: string) => navigate(`/admin/staff/${id}`);

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
            ? shiftRes.allShifts.filter((s) => s.status === "unassigned")
                .length
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
          onClick={() => handleOnView(u._id)}
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
          onClick={() => console.log("team", t)}
        >
          View/Action
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

  const tables: Record<TableName, ReactNode> = {
    staff: (
      <DataTable
        columns={staffColumns}
        rows={staffList}
        getKey={(u) => u.email}
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
      <DataTable
        columns={teamColumns}
        rows={teamList}
        getKey={(c) => c.name} // use a unique field your IClient really has
      />
    ),
  };

  useEffect(() => {
    const loadUser = async () => {
      const res = await getAllUsers();
      if (res.status === "success") {
        setStaffList(res.allUsers);
        setLoadError("");
      } else {
        setLoadError(res.message);
      }

      const clientRes = await getAllClients();

      if (clientRes.status === "success") {
        setClientList(clientRes.clients);
        setLoadError("");
      } else {
        setLoadError(res.message);
      }

      const teamRes = await getAllTeams();
      if (teamRes.status === "success") {
        setTeamList(teamRes.teams);
        setLoadError("");
      } else {
        setLoadError(res.message);
      }
    };

    loadUser();
  }, []);

  return (
    <>
      <div className="layoutWrapper p-3">
        {/* <div className="sideBar d-flex flex-column gap-3">
          <div className="sideBarMenu">
            {" "}
            <MdOutlineDashboard /> Dashboard
          </div>
          <div className="sideBarMenu">
            {" "}
            <SlPeople /> Staff Management
          </div>
          <div className="sideBarMenu">
            {" "}
            <RiTeamLine /> Team Management
          </div>
          <div className="sideBarMenu">
            {" "}
            <SlCalender /> All Workers Shifts
          </div>
        </div> */}

        <Container>
          <Row>
            <Col className="">
              {" "}
              <div className="title">Welcome {user?.name}</div>
              <span className="mutedDate">{user?.role.toUpperCase()}</span>{" "}
              <br />
              <span className="mutedDate">{today}</span>
            </Col>
          </Row>
        </Container>

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
            <div className="quickActions d-flex gap-3 mt-3">
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

          <div className="mainScreenSection mt-4">
            <div className="d-flex gap-2 mb-3">
              <Button onClick={() => setShowTable("staff")}>Staff</Button>
              <Button onClick={() => setShowTable("client")}>Clients</Button>
              <Button onClick={() => setShowTable("team")}>Teams</Button>
            </div>

            {/* key resets DataTable to page 1 when you switch tables */}
            <div key={showTable}>{tables[showTable]}</div>
          </div>

          <div className="mainScreenSection">
            <div className="subtitle">Staff Management</div>
          </div>
        </div>
      </div>
    </>
  );
};
