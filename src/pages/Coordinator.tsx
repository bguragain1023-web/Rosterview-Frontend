import { CoordinatorCalender } from "../components/CoordinatorCalender";
import { OperationButton } from "../components/custom/Button";

export const Coordinator = () => {
  interface SidebarAction {
    id: string;
    label: string;
    onClick: () => void;
  }

  const sidebarActions: SidebarAction[] = [
    {
      id: "add-staff",
      label: "Add New Staff",
      onClick: () => console.log("Add staff clicked"),
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
    <div className="layoutWrapper">
      <div className="title text-center">Welcome to your Dahboard</div>

      <div className="main d-flex m-3 gap-2">
        <div className="left-coord">
          <CoordinatorCalender />
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
    </div>
  );
};
