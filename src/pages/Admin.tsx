import Table from "react-bootstrap/Table";

export const Admin = () => {
  return (
    <>
      <div className="layoutWrapper d-flex p-3">
        <div className="sideBar d-flex flex-column gap-3">
          <div className="sideBarMenu">Dashboard</div>
          <div className="sideBarMenu">Staff Management</div>
          <div className="sideBarMenu">Team Management</div>
          <div className="sideBarMenu">All Workers Shifts</div>
        </div>
        <div className="mainScreen">
          <div className="mainScreenSection">
            <div className="pageName d-flex justify-content-between align-items-center p-2">
              <div className="dashboardName">
                <div className="title">Admin Dashboard</div>
                <span className="mutedDate">Wednesday, 12 Oct 2026</span>
              </div>
              <div className="profile">
                <div className="logout">logout</div>
              </div>
            </div>
          </div>

          <div className="mainScreenSection d-flex gap-2 justify-content-between align-items-center p-2 mt-3">
            <div className="staffDetail text-center">
              <div className="total">Total Staff</div>
              <hr />
              <span>20</span>
            </div>

            <div className="staffDetail text-center">
              <div className="total">Total Staff</div>
              <hr />
              <span>20</span>
            </div>

            <div className="staffDetail text-center">
              <div className="total">Total Staff</div>
              <hr />
              <span>20</span>
            </div>

            <div className="staffDetail text-center">
              <div className="total">Total Staff</div>
              <hr />
              <span>20</span>
            </div>
          </div>

          <div className="mainScreenSection mt-5">
            <div className="subtitle">Quick Actions</div>
            <div className="quickActions d-flex gap-3 mt-3">
              <div className="quickActionMenu">Add New Staff</div>
              <div className="quickActionMenu">Create Shift</div>
              <div className="quickActionMenu">Create Team</div>
              <div className="quickActionMenu">View All Workers's Shift</div>
            </div>
          </div>

          <div className="mainScreenSection mt-3">
            <div>Recentlt added staff</div>
            <Table hover>
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
