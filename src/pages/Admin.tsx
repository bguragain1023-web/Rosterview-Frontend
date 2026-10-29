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
import { useEffect, useState, type ReactNode } from "react";
import { DataTable, type Column } from "../components/custom/DataTable";
import {
  getAllClients,
  getAllTeams,
  getAllUsers,
  type IClient,
  type ITeam,
  type IUser,
} from "../helper/axios";
import { Button, Col, Container, Row } from "react-bootstrap";

type TableName = "staff" | "client" | "team";

const staffColumns: Column<IUser>[] = [
  {
    header: "Name",
    render: (u) => u.name,
  },
  { header: "Email", render: (u) => u.email },
  { header: "Phone", render: (u) => u.phone },
  { header: "Role", render: (u) => u.role },
  { header: "Status", render: (u) => u.status },
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
  { header: "Team Leader", render: (t) => t.teamLeaderId },
  { header: "Description", render: (t) => t.description },
];

export const Admin = () => {
  const [showTable, setShowTable] = useState<TableName>("staff");
  const [staffList, setStaffList] = useState<IUser[]>([]);
  const [clientList, setClientList] = useState<IClient[]>([]);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  const [loadError, setLoadError] = useState("");
  const { setActiveModal, activeModal, user } = useUser();
  const closeModal = () => setActiveModal(null);

  const modals = {
    addStaff: { title: "Add New Staff", body: <AddStaffForm /> },
    updateStaff: { title: "Update Staff Detail", body: <>Comming soon</> },
    createShift: { title: " Create Shift", body: <>Coming sooon</> },
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

  console.log("TEAMLIST !!!!!!!!!&&&***** ", teamList);

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

              {/* <div
                className="quickActionMenu"
                onClick={() => setActiveModal("createShift")}
              >
                Create Shift
              </div> */}
              <div
                className="quickActionMenu"
                onClick={() => setActiveModal("createTeam")}
              >
                Create Team
              </div>
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
