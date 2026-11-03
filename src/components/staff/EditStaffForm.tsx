import { useEffect, useState, type SubmitEvent } from "react";
import { Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import useForm from "../../hooks/useForm";
import {
  getAllTeams,
  updateStaff,
  type ITeam,
  type IUserDetail,
  type UpdateStaffPayload,
  type userRole,
} from "../../helper/axios";

interface EditStaffFormProps {
  staff: IUserDetail;
  onCancel: () => void;
  onSaved: () => void;
}

const roleOptions: { value: userRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "coordinator", label: "Coordinator" },
  { value: "teamLeader", label: "Team Leader" },
  { value: "worker", label: "Worker" },
];

export const EditStaffForm = ({
  staff,
  onCancel,
  onSaved,
}: EditStaffFormProps) => {
  const { form, handleOnChange } = useForm({
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    role: staff.role ?? "",
    status: staff.status,
    team: staff.team?.name ?? "",
  });
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const currentTeam = staff.team?.name;

  useEffect(() => {
    let ignore = false;

    getAllTeams().then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        // Active teams, plus the user's current team even if it's inactive,
        // so the dropdown can still show what they're in.
        setTeams(
          res.teams.filter((t) => t.isActive || t.name === currentTeam),
        );
      } else {
        toast.error(res.message);
      }
    });

    return () => {
      ignore = true;
    };
  }, [currentTeam]);

  const handleOnSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Only send what changed.
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    const changes: UpdateStaffPayload = {};
    if (name !== staff.name) changes.name = name;
    if (email !== staff.email) changes.email = email;
    if (phone !== staff.phone) changes.phone = phone;
    if (form.role && form.role !== staff.role) {
      changes.role = form.role as userRole;
    }
    if (form.status !== staff.status) changes.status = form.status;
    if (form.team && form.team !== staff.team?.name) changes.team = form.team;

    if (Object.keys(changes).length === 0) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);
    const res = await updateStaff(staff._id, changes);
    setIsSaving(false);

    toast[res.status](res.message);
    if (res.status === "success") {
      onSaved();
    }
  };

  return (
    <Form onSubmit={handleOnSubmit}>
      <div className="subtitle mb-3">Edit user detail</div>

      <Form.Group className="mb-3" controlId="editStaffName">
        <Form.Label>Full name</Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={form.name}
          onChange={handleOnChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="editStaffEmail">
        <Form.Label>Email address</Form.Label>
        <Form.Control
          type="email"
          name="email"
          value={form.email}
          onChange={handleOnChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="editStaffPhone">
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

      <Form.Group className="mb-3" controlId="editStaffRole">
        <Form.Label>Role</Form.Label>
        <Form.Select name="role" value={form.role} onChange={handleOnChange}>
          {!staff.role && <option value="">Select role</option>}
          {roleOptions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3" controlId="editStaffStatus">
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

      <Form.Group className="mb-3" controlId="editStaffTeam">
        <Form.Label>Team</Form.Label>
        <Form.Select name="team" value={form.team} onChange={handleOnChange}>
          {/* The backend can't remove a user from a team, so "Unassigned"
              is only offered while they don't have one. */}
          {!staff.team && <option value="">Unassigned</option>}
          {teams.map((t) => (
            <option key={t._id} value={t.name}>
              {t.name}
            </option>
          ))}
        </Form.Select>
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
