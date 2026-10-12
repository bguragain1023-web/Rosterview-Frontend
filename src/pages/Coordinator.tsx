export const Coordinator = () => {
  return (
    <>
      <div className="layoutWrapper">
        <div className="sideBar">
          <div className="sideBarMenu">Dashboard</div>
          <div className="sideBarMenu">Staff Management</div>
          <div className="sideBarMenu">Team Management</div>
          <div className="sideBarMenu">All Workers Shifts</div>
        </div>
        <div className="mainScreen">
          <div className="mainScreenSection"></div>
          <div className="mainScreenSection"></div>
          <div className="mainScreenSection"></div>
          <div className="mainScreenSection"></div>
        </div>
      </div>
    </>
  );
};
