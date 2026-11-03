import { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { ConfirmModal } from "../custom/ConfirmModal";
import {
  addTeamMember,
  getAllUsers,
  removeTeamMember,
  type ITeamDetail,
  type ITeamMember,
  type IUser,
} from "../../helper/axios";
import { roleLabel } from "../../utils/format";

interface ManageMembersPanelProps {
  team: ITeamDetail;
  onChanged: () => void; // reload the team, keep this panel open
  onDone: () => void; // back to the card
}

export const ManageMembersPanel = ({
  team,
  onChanged,
  onDone,
}: ManageMembersPanelProps) => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [usersReloadKey, setUsersReloadKey] = useState(0);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removing, setRemoving] = useState<ITeamMember | null>(null);

  // Users, to know who can still be added (reloaded after each change).
  useEffect(() => {
    let ignore = false;

    getAllUsers().then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setUsers(res.allUsers);
      } else {
        toast.error(res.message);
      }
    });

    return () => {
      ignore = true;
    };
  }, [usersReloadKey]);

  // Same rules as the backend: active workers who aren't in a team.
  const availableWorkers = users.filter(
    (u) => u.role === "worker" && u.status === "active" && !u.teamId,
  );

  const afterChange = () => {
    setUsersReloadKey((k) => k + 1);
    onChanged();
  };

  const handleAdd = async () => {
    if (!selectedWorker) return;
    setIsAdding(true);
    const res = await addTeamMember(team._id, selectedWorker);
    setIsAdding(false);

    if (res.status !== "success") {
      toast.error(res.message);
      return;
    }
    const name = users.find((u) => u._id === selectedWorker)?.name;
    toast.success(name ? `${name} added to ${team.name}` : res.message);
    setSelectedWorker("");
    afterChange();
  };

  const handleRemove = async () => {
    if (!removing) return;
    const res = await removeTeamMember(team._id, removing._id);
    toast[res.status](res.message);
    if (res.status === "success") {
      setRemoving(null);
      afterChange();
    }
  };

  const leaderId = team.teamLeader?._id;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="subtitle">Manage members — {team.name}</div>
        <Button variant="outline-light" size="sm" onClick={onDone}>
          Done
        </Button>
      </div>

      <div className="teamMembersTitle mt-0 pt-0 border-0">
        MEMBERS ({team.members.length})
      </div>
      {team.members.length === 0 ? (
        <p className="mutedDate">No members yet</p>
      ) : (
        <ul className="teamMembers manageMembers">
          {team.members.map((m) => (
            <li key={m._id}>
              <span className="memberName">{m.name}</span>
              <span className="roleBadge">{roleLabel(m.role)}</span>
              <span className={`statusPill ${m.status}`}>{m.status}</span>
              {m._id === leaderId ? (
                <span className="mutedDate memberAction">
                  change in Edit team
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline-danger"
                  className="memberAction"
                  onClick={() => setRemoving(m)}
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="teamMembersTitle">ADD A WORKER</div>
      {!team.isActive ? (
        <p className="mutedDate mb-0">
          Activate the team in Edit team to add workers.
        </p>
      ) : availableWorkers.length === 0 ? (
        <p className="mutedDate mb-0">No unassigned active workers.</p>
      ) : (
        <>
          <div className="d-flex gap-2">
            <Form.Select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              aria-label="Worker to add"
            >
              <option value="">Select worker</option>
              {availableWorkers.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </Form.Select>
            <Button onClick={handleAdd} disabled={!selectedWorker || isAdding}>
              {isAdding ? "Adding..." : "Add"}
            </Button>
          </div>
          <Form.Text className="mutedDate">
            Only active workers who aren't in a team are listed.
          </Form.Text>
        </>
      )}

      <ConfirmModal
        show={removing !== null}
        title="Remove member"
        message={
          <>
            Remove {removing?.name} from {team.name}?
          </>
        }
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleRemove}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
};
