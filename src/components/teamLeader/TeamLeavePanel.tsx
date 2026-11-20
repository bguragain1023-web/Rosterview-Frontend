import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getLeaveRequests, type ILeaveRequest } from "../../helper/axios";
import { LeaveRequestsTab } from "../shifts/LeaveRequestsTab";

interface TeamLeavePanelProps {
  onChanged?: () => void; // e.g. refresh the "Needs attention" counts
}

// For a team leader, the backend returns leave from their team members
// (not their own).
export const TeamLeavePanel = ({ onChanged }: TeamLeavePanelProps) => {
  const [leaves, setLeaves] = useState<ILeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    getLeaveRequests().then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setLeaves(res.leaveRequests);
      } else {
        toast.error(res.message);
      }
      setIsLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  // No clientNames (team leaders can't read clients) and no "Cancel leave"
  // (needs leave:delete).
  return (
    <LeaveRequestsTab
      leaves={leaves}
      isLoading={isLoading}
      canCancelApproved={false}
      onChanged={() => {
        setReloadKey((k) => k + 1); // reload this list
        onChanged?.(); // tell the parent
      }}
    />
  );
};
