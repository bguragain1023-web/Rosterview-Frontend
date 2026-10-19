import { Button } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import useForm from "../../hooks/useForm";
import type { SubmitEvent } from "react";
import { toast } from "react-toastify";
import { useUser } from "../../contex/UserContext";
import { CustomInput } from "../custom/CustomInput";
import { addNewUser } from "../../helper/axios";

export interface AddStaffPayload {
  name: string;
  role: string;
  phone: string;
  email: string;
}

const initialState = {
  name: "",
  role: "",
  email: "",
  phone: "",
};

export const AddStaffForm = () => {
  const { setActiveModal } = useUser();
  const { form, setForm, handleOnChange } =
    useForm<AddStaffPayload>(initialState);

  const inputFields = [
    {
      label: "Full Name",
      type: "text",
      placeholder: "eg : John Doe",
      name: "name",
      value: form.name,
    },

    {
      label: "Email Address",
      type: "email",
      placeholder: "eg: abc@email.com",
      name: "email",
      value: form.email,
    },

    {
      label: "Role",
      type: "text",
      placeholder: "Role",
      name: "role",
      value: form.role,
    },

    {
      label: "Phone no.",
      type: "text",
      placeholder: "eg:0400000000",
      name: "phone",
      value: form.phone,
    },
  ];

  const handleOnSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Add form submitted", form);

    const pendingState = addNewUser(form);
    toast.promise(pendingState, {
      pending: "Adding New staff, please Wait!!",
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
      {inputFields.map((input) => (
        <CustomInput key={input.name} {...input} onChange={handleOnChange} />
      ))}

      <Button variant="primary" type="submit">
        Submit
      </Button>
    </Form>
  );
};
