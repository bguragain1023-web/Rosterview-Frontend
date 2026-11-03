import { useEffect, useState, type SubmitEvent } from "react";
import { Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import useForm from "../../hooks/useForm";
import {
  getAllTeams,
  getAllUsers,
  updateTeam,
  type ITeam,
  type ITeamDetail,
  type IUser,
  type UpdateTeamPayload,
} from "../../helper/axios";

interface EditTeamFormProps {
  team: ITeamDetail;
  onCancel: () => void;
  onSaved: () => void;
}

export const EditTeamForm = ({ team, onCancel, onSaved }: EditTeamFormProps) => {
  const currentLeaderId = team.teamLeader?._id ?? "";
  const { form, handleOnChange } = useForm({
    name: team.name,
    description: team.description ?? "",
    status: team.isActive ? "active" : "inactive",
    teamLeaderId: currentLeaderId, // "" = no leader
  });
  const [users, setUsers] = useState<IUser[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    Promise.all([getAllUsers(), getAllTeams()]).then(([userRes, teamRes]) => {
      if (ignore) return;
      if (userRes.status === "success") {
        setUsers(userRes.allUsers);
      } else {
        toast.error(userRes.message);
      }
      if (teamRes.status === "success") {
        setTeams(teamRes.teams);
      } else {
        toast.error(teamRes.message);
      }
      setIsLoadingOptions(false);
    });

    return () => {
      ignore = true;
    };
  }, []);

  // Only people the backend would accept: active Team Leaders who aren't in
  // or leading another team. The current leader is always included.
  const leaderOptions = users.filter((u) => {
    if (u._id === currentLeaderId) return true;
    if (u.role !== "teamLeader" || u.status !== "active") return false;
    if (u.teamId && u.teamId !== team._id) return false;
    const leadsOther = teams.some(
      (t) => t.teamLeaderId === u._id && t._id !== team._id,
    );
    return !leadsOther;
  });

  const leaderChanging = form.teamLeaderId !== currentLeaderId;
  const deactivating = team.isActive && form.status === "inactive";

  const handleOnSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const changes: UpdateTeamPayload = {};
    const name = form.name.trim();
    const description = form.description.trim();
    const isActive = form.status === "active";

    if (name !== team.name) changes.name = name;
    if (description !== (team.description ?? "")) {
      changes.description = description;
    }
    if (isActive !== team.isActive) changes.isActive = isActive;
    if (leaderChanging) changes.teamLeaderId = form.teamLeaderId || null;

    if (Object.keys(changes).length === 0) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);
    const res = await updateTeam(team._id, changes);
    setIsSaving(false);

    toast[res.status](res.message);
    if (res.status === "success") {
      onSaved();
    }
  };

  return (
    <Form onSubmit={handleOnSubmit}>
      <div className="subtitle mb-3">Edit team</div>

      <Form.Group className="mb-3" controlId="editTeamName">
        <Form.Label>Team name</Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={form.name}
          onChange={handleOnChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="editTeamDescription">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          name="description"
          value={form.description}
          onChange={handleOnChange}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="editTeamStatus">
        <Form.Label>Status</Form.Label>
        <Form.Select name="status" value={form.status} onChange={handleOnChange}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Form.Select>
        {deactivating && team.members.length > 0 && (
          <Form.Text className="mutedDate">
            Members stay in this team, but no new workers can be added while
            it's inactive.
          </Form.Text>
        )}
      </Form.Group>

      <Form.Group className="mb-3" controlId="editTeamLeader">
        <Form.Label>Team leader</Form.Label>
        <Form.Select
          name="teamLeaderId"
          value={form.teamLeaderId}
          onChange={handleOnChange}
          disabled={isLoadingOptions}
        >
          <option value="">No leader</option>
          {leaderOptions.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name}
            </option>
          ))}
        </Form.Select>
        {leaderChanging && team.teamLeader && (
          <Form.Text className="mutedDate">
            {team.teamLeader.name} will be removed from this team.
          </Form.Text>
        )}
        {!isLoadingOptions &&
          leaderOptions.filter((u) => u._id !== currentLeaderId).length ===
            0 && (
            <Form.Text className="mutedDate d-block">
              No available team leaders. Give a staff member the Team Leader
              role on their staff page first.
            </Form.Text>
          )}
      </Form.Group>

      <div className="d-flex gap-2 mt-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline-light" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </Form>
  );
};
