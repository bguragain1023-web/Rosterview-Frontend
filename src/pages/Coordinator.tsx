import { useState } from "react";
import { CoordinatorCalender } from "../components/CoordinatorCalender";
import { OperationButton } from "../components/custom/Button";
import type { Value } from "react-calendar/dist/shared/types.js";
import { AppModal } from "../components/custom/AppModal";

type DetailView = "schedule" | "swapRequest" | "conflicts";

type ModalType = "addStaff" | "updateRole" | "createShift" | null;

interface SidebarAction {
  id: string;
  label: string;
  onClick: () => void;
}

export const Coordinator = () => {
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  const [activeView, setActiveView] = useState<DetailView>("schedule");
  const [activeModal, setActiveModal] = useState<ModalType>(null);

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
      onClick: () => console.log("Update role clicked"),
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
          <div>All the schedule for the day here</div>
        )}
        {activeView === "conflicts" && (
          <div>All the schedule for the day here</div>
        )}
      </div>

      <br />
      <AppModal
        show={activeModal === "addStaff"}
        onClose={() => setActiveModal(null)}
        title="Add New Staff"
      ></AppModal>
    </div>
  );
};
