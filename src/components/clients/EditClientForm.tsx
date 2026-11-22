import { useEffect, useState, type SubmitEvent } from "react";
import { Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import useForm from "../../hooks/useForm";
import {
  getAllTeams,
  updateClient,
  type IClient,
  type ITeam,
  type UpdateClientPayload,
} from "../../helper/axios";

interface EditClientFormProps {
  client: IClient;
  onCancel: () => void;
  onSaved: () => void;
}

export const EditClientForm = ({
  client,
  onCancel,
  onSaved,
}: EditClientFormProps) => {
  // 1. Start the form filled in with the client's current details.
  const { form, handleOnChange } = useForm({
    name: client.name,
    phone: client.phone,
    address: client.address,
    email: client.email,
    notes: client.notes ?? "",
    status: client.isActive ? "active" : "inactive",
    teamId: client.teamId ?? "",
  });
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const currentTeamId = client.teamId;

  // 2. Load teams for the dropdown.
  useEffect(() => {
    let ignore = false;

    getAllTeams().then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        // Active teams, plus the client's current team even if it's inactive,
        // so the dropdown can still show it.
        setTeams(
          res.teams.filter((t) => t.isActive || t._id === currentTeamId),
        );
      } else {
        toast.error(res.message);
      }
    });

    return () => {
      ignore = true;
    };
  }, [currentTeamId]);

  // 3. On save: work out what changed and send only that.
  const handleOnSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const changes: UpdateClientPayload = {};
    const name = form.name.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();
    const email = form.email.trim().toLowerCase();
    const notes = form.notes.trim();
    const isActive = form.status === "active";

    if (name !== client.name) changes.name = name;
    if (phone !== client.phone) changes.phone = phone;
    if (address !== client.address) changes.address = address;
    if (email !== client.email) changes.email = email;
    if (notes !== (client.notes ?? "")) changes.notes = notes;
    if (isActive !== client.isActive) changes.isActive = isActive;
    if (form.teamId && form.teamId !== client.teamId) {
      changes.teamId = form.teamId;
    }

    if (Object.keys(changes).length === 0) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);
    const res = await updateClient(client._id, changes);
    setIsSaving(false);

    toast[res.status](res.message);
    if (res.status === "success") onSaved();
  };

  // 4. The form.
  return (
    <Form onSubmit={handleOnSubmit}>
      <Form.Group className="mb-3" controlId="editClientName">
        <Form.Label>Full name</Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={form.name}
          onChange={handleOnChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="editClientPhone">
        <Form.Label>Phone</Form.Label>
        <Form.Control
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleOnChange}
          placeholder="04XXXXXXXX"
          pattern="04\d{8}"
          title="Australian mobile number, e.g. 0400000000"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="editClientAddress">
        <Form.Label>Address</Form.Label>
        <Form.Control
          type="text"
          name="address"
          value={form.address}
          onChange={handleOnChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="editClientEmail">
        <Form.Label>Email address</Form.Label>
        <Form.Control
          type="email"
          name="email"
          value={form.email}
          onChange={handleOnChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="editClientNotes">
        <Form.Label>Notes</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          name="notes"
          value={form.notes}
          onChange={handleOnChange}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="editClientStatus">
        <Form.Label>Status</Form.Label>
        <Form.Select
          name="status"
          value={form.status}
          onChange={handleOnChange}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3" controlId="editClientTeam">
        <Form.Label>Team (area)</Form.Label>
        <Form.Select
          name="teamId"
          value={form.teamId}
          onChange={handleOnChange}
        >
          {/* Older clients have no team yet. The backend can't remove a team,
              so "No team yet" is only offered while there isn't one. */}
          {!client.teamId && <option value="">No team yet</option>}
          {teams.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
              {!t.isActive && " (inactive)"}
            </option>
          ))}
        </Form.Select>
        <Form.Text className="mutedDate">
          Only workers in this team can be assigned to this client's shifts.
        </Form.Text>
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
