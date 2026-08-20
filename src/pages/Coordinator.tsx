import { useState } from "react";
import { CoordinatorCalender } from "../components/CoordinatorCalender";
import { OperationButton } from "../components/custom/Button";
import type { Value } from "react-calendar/dist/shared/types.js";
import { AppModal } from "../components/custom/AppModal";
import { AddStaffForm } from "../components/forms/AddStaffForm";
import { useUser } from "../contex/UserContext";
import { fetchAllUsers } from "../helper/axios";
import { toast } from "react-toastify";

import { UsersTable } from "../components/UsersTable";
import { UpdateStaffForm } from "../components/forms/UpdateStaffForm";

type DetailView = "schedule" | "swapRequest" | "conflicts" | "updateRole";

interface SidebarAction {
  id: string;
  label: string;
  onClick: () => void;
}

export const Coordinator = () => {
  const { activeModal, setActiveModal, allUsers, setAllUsers } = useUser();
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  const [activeView, setActiveView] = useState<DetailView>("schedule");

  const handleDateChange = (value: Value) => {
    setSelectedDate(value);
    setActiveView("schedule");
  };
  const sidebarActions: SidebarAction[] = [
    {
      id: "add-staff",
      label: "Add New Staff",
      onClick: () => setActiveModal("addStaff"),
    },
    {
      id: "update-role",
      label: "Update Staff Role",
      onClick: () => updateStaffRole(),
    },
    {
      id: "view-assigned",
      label: "View All Assigned Shifts",
      onClick: () => console.log("View assigned clicked"),
    },
    {
      id: "view-unassigned",
      label: "View All Unassigned Shifts",
      onClick: () => console.log("View unassigned clicked"),
    },
    {
      id: "create-shift",
      label: "Create New Shift",
      onClick: () => console.log("Create shift clicked"),
    },
    {
      id: "view-swap",
      label: "View Swap Request",
      onClick: () => console.log("View swap clicked"),
    },
    {
      id: "show-conflicts",
      label: "Show Conflicts",
      onClick: () => console.log("Show conflicts clicked"),
    },
  ];

  const updateStaffRole = async () => {
    // call axios for get all users const
    setActiveView("updateRole");

    const pendingState = fetchAllUsers();

    toast.promise(pendingState, {
      pending: "Please wait !! Fetching all users..",
    });

    const { status, message, users } = await pendingState;

    toast[status](message);
    if (status === "success" && users.length > 0) {
      setAllUsers(users);
    }
  };
  console.log(allUsers);

  return (
    <div className="layoutWrapper container">
      <div className="title text-center">Welcome to your Dahboard</div>

      <div className="main d-flex m-3 gap-2">
        <div className="left-coord">
          <CoordinatorCalender
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
        </div>

        <div className="right-coord">
          {sidebarActions.map((action) => (
            <OperationButton
              key={action.id}
              label={action.label}
              onClick={action.onClick}
            />
          ))}
        </div>
      </div>
      <br />
      <div className="responseBox container">
        {activeView === "schedule" && (
          <div>All the schedule for the day here</div>
        )}
        {activeView === "swapRequest" && (
          <div>All the sshift swap request </div>
        )}
        {activeView === "conflicts" && <div>All the conflicts here </div>}
        {activeView === "updateRole" && (
          <div>
            <UsersTable />
          </div>
        )}
      </div>

      <br />
      <AppModal
        show={activeModal === "addStaff"}
        onClose={() => setActiveModal(null)}
        title="Add New Staff"
      >
        <AddStaffForm />
      </AppModal>

      <AppModal
        show={activeModal === "updateRole"}
        onClose={() => setActiveModal(null)}
        title="Update staff detail"
      >
        <UpdateStaffForm />
      </AppModal>
    </div>
  );
};
