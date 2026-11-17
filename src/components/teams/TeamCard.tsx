import { Link } from "react-router-dom";
import type { ITeamDetail } from "../../helper/axios";
import { formatDate, getInitials, roleLabel } from "../../utils/format";

interface TeamCardProps {
  team: ITeamDetail;
  // Admin pages link each member to their staff page; workers just see names.
  linkMembers?: boolean;
  // Marks this member with "(you)"
  currentUserId?: string;
}

export const TeamCard = ({
  team,
  linkMembers = true,
  currentUserId,
}: TeamCardProps) => {
  const { members } = team;
  const status = team.isActive ? "active" : "inactive";

  return (
    <div className="staffIdCard">
      <div className="staffIdCardHeader">
        <span>ROSTER VIEW · TEAM</span>
        <span>
          {members.length} member{members.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="staffIdCardTop">
        <div className="staffAvatar">{getInitials(team.name)}</div>
        <div>
          <div className="staffIdName">{team.name}</div>
          <span className={`statusPill ${status}`}>{status}</span>
        </div>
      </div>

      <dl className="staffIdFields">
        <dt>Description</dt>
        <dd>{team.description || "—"}</dd>

        <dt>Team leader</dt>
        <dd>{team.teamLeader?.name ?? "No leader"}</dd>

        <dt>Created</dt>
        <dd>{formatDate(team.createdAt)}</dd>
      </dl>

      <div className="teamMembersTitle">MEMBERS</div>
      {members.length === 0 ? (
        <p className="mutedDate mb-0">No members yet</p>
      ) : (
        <ul className="teamMembers">
          {members.map((m) => (
            <li key={m._id}>
              {linkMembers ? (
                <Link to={`/admin/staff/${m._id}`}>{m.name}</Link>
              ) : (
                <span className="memberName">{m.name}</span>
              )}
              {m._id === currentUserId && (
                <span className="mutedDate">(you)</span>
              )}
              <span className="roleBadge">{roleLabel(m.role)}</span>
              <span className={`statusPill ${m.status}`}>{m.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
