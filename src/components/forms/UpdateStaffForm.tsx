import { Button, Form } from "react-bootstrap";
import useForm from "../../hooks/useForm";
import { useUser } from "../../contex/UserContext";
import type { UpdateStaffPayload } from "../../types/types";
import { useEffect } from "react";
import { updateStaff } from "../../helper/axios";
import { toast } from "react-toastify";

const initialStateState: UpdateStaffPayload = {
  name: "",
  email: "",
  role: "",
  phone: "",
};

export const UpdateStaffForm = () => {
  const { editUser, setActiveModal } = useUser();
  const { form, setForm, handleOnChange } = useForm<UpdateStaffPayload>(
    editUser ? { ...editUser } : initialStateState,
  );

  useEffect(() => {
    console.log("editUser changed:", editUser);
    if (editUser) {
      setForm({ ...editUser });
    }
  }, [editUser]);

  console.log("current form state:", form);
  const handleOnSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editUser) return;

    if (form.role !== "coordinator" && form.role !== "worker") {
      toast.error("Please select a role");
      return;
    }

    const result = await updateStaff(editUser._id, {
      ...form,
      role: form.role,
    });

    toast[result.status](result.message);
    if (result.status === "success") {
      setActiveModal(null);
    }
  };

  return (
    <Form onSubmit={handleOnSubmit}>
      <Form.Group className="mb-3" controlId="formBasicRole">
        <Form.Label>Role</Form.Label>
        <Form.Select
          name="role"
          value={form.role}
          onChange={handleOnChange}
          required
        >
          <option value="">Select</option>
          <option value="coordinator">Co-ordinator</option>
          <option value="worker">Worker</option>
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3" controlId="formBasicName">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter Full Name"
          name="name"
          value={form.name}
          onChange={handleOnChange}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="formBasicEmail">
        <Form.Label>Email address</Form.Label>
        <Form.Control
          type="email"
          placeholder="Enter email"
          name="email"
          value={form.email}
          onChange={handleOnChange}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="formBasicphone">
        <Form.Label>Phone </Form.Label>
        <Form.Control
          type="number"
          placeholder="Phone number"
          name="phone"
          value={form.phone}
          onChange={handleOnChange}
          required
        />
      </Form.Group>

      <Button variant="primary" type="submit">
        Update
      </Button>
    </Form>
  );
};
