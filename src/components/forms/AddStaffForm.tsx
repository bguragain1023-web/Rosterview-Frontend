import { Button } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import useForm from "../../hooks/useForm";
import type { SubmitEvent } from "react";
import type { AddStaffPayload } from "../../types/types";
import { addNewStaff } from "../../helper/axios";
import { toast } from "react-toastify";
import { useUser } from "../../contex/UserContext";

export const AddStaffForm = () => {
  const initialState = {
    name: "",
    role: "",
    email: "",
    password: "",
  };

  const { setActiveModal } = useUser();
  const { form, setForm, handleOnChange } =
    useForm<AddStaffPayload>(initialState);

  const handleOnSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Add form submitted", form);
    const pendingState = addNewStaff(form);
    toast.promise(pendingState, {
      pending: "Adding New staff",
    });

    const { status, message } = await pendingState;
    toast[status](message);
    if (status === "success") {
      setForm(initialState);
      setActiveModal(null);
    }
  };
  return (
    <Form onSubmit={handleOnSubmit}>
      <Form.Group className="mb-3" controlId="formBasicRole">
        <Form.Label>Role</Form.Label>
        <Form.Select name="role" onChange={handleOnChange} required>
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
          onChange={handleOnChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="formBasicPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Password"
          name="password"
          onChange={handleOnChange}
          required
        />
      </Form.Group>

      <Button variant="primary" type="submit">
        Submit
      </Button>
    </Form>
  );
};
