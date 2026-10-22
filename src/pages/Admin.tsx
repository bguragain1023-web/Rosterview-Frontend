import Table from "react-bootstrap/Table";
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

export const Admin = () => {
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

  return (
    <>
      <div className="layoutWrapper d-flex p-3">
        <div className="sideBar d-flex flex-column gap-3">
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
        </div>
        <div className="mainScreen">
          <div className="mainScreenSection">
            <div className="pageName d-flex justify-content-between align-items-center p-2">
              <div className="dashboardName">
                <div className="title">Admin Dashboard</div>
                <span className="mutedDate">{today}</span>
              </div>
              <div className="profile">
                <div className="profileName">Welcome {user?.name}</div>
              </div>
            </div>
          </div>

          <div className="mainScreenSection d-flex gap-2 p-1 mt-3 flex-wrap">
            <div className="staffDetail justify-content-center  d-flex align-items-center gap-3  ">
              <div className="staffDetailIcon">
                <SlPeople />
              </div>
              <div>
                <div className="total"> Total Staff</div>
                <hr />
                <span>20</span>
              </div>
            </div>

            <div className="staffDetail justify-content-center  d-flex align-items-center gap-3  ">
              <div className="staffDetailIcon">
                <SlPeople />
              </div>
              <div>
                <div className="total"> Total Team</div>
                <hr />
                <span>20</span>
              </div>
            </div>

            <div className="staffDetail justify-content-center  d-flex align-items-center gap-3  ">
              <div className="staffDetailIcon">
                <SlPeople />
              </div>
              <div>
                <div className="total"> Total Clients</div>
                <hr />
                <span>20</span>
              </div>
            </div>

            <div className="staffDetail justify-content-center  d-flex align-items-center gap-3  ">
              <div className="staffDetailIcon">
                <SlPeople />
              </div>
              <div>
                <div className="total">Coordinators and Leaders</div>
                <hr />
                <span>20</span>
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
            <div>Recently added staff</div>
            <Table hover className="mt-3">
              <thead>
                <tr>
                  <th>#</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Username</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Mark</td>
                  <td>Otto</td>
                  <td>@mdo</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Jacob</td>
                  <td>Thornton</td>
                  <td>@fat</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Larry the Bird</td>
                  <td>Larry the Bird</td>
                  <td>@twitter</td>
                </tr>
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
};
