import type { IUserDetail, userRole } from "../../helper/axios";

const roleLabels: Record<userRole, string> = {
  admin: "Admin",
  coordinator: "Coordinator",
  teamLeader: "Team Leader",
  worker: "Worker",
};

const roleLabel = (role: userRole | null) => (role ? roleLabels[role] : "No role");

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const StaffIdCard = ({ staff }: { staff: IUserDetail }) => {
  const staffNo = staff._id.slice(-6).toUpperCase();

  const passwordText = staff.mustChangePassword
    ? "Must change on next login"
    : staff.passwordChangedAt
      ? `Changed ${formatDate(staff.passwordChangedAt)}`
      : "—";

  return (
    <div className="staffIdCard">
      <div className="staffIdCardHeader">
        <span>ROSTER VIEW · STAFF ID</span>
        <span>#{staffNo}</span>
      </div>

      <div className="staffIdCardTop">
        <div className="staffAvatar">{getInitials(staff.name)}</div>
        <div>
          <div className="staffIdName">{staff.name}</div>
          <span className="roleBadge">{roleLabel(staff.role)}</span>
          <span className={`statusPill ${staff.status}`}>{staff.status}</span>
        </div>
      </div>

      <dl className="staffIdFields">
        <dt>Email</dt>
        <dd>{staff.email}</dd>

        <dt>Phone</dt>
        <dd>{staff.phone}</dd>

        <dt>Team</dt>
        <dd>{staff.team?.name ?? "Unassigned"}</dd>

        <dt>Joined</dt>
        <dd>{formatDate(staff.createdAt)}</dd>

        <dt>Password</dt>
        <dd>{passwordText}</dd>

        <dt>Extra permissions</dt>
        <dd>{staff.additionalPermissions.length || "None"}</dd>
      </dl>
    </div>
  );
};
