import { Button } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import useForm from "../../hooks/useForm";
import { useState, type SubmitEvent } from "react";
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

  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [isCreated, setIsCreated] = useState(false);

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

    const response = await pendingState;
    toast[response.status](response.message);
    if (response.status === "success") {
      setForm(initialState);
      setTemporaryPassword(response.tempPassword);
      setIsCreated(true);
    }
  };
  return (
    <>
      {isCreated ? (
        <div>
          <h5>Staff member created successfully!</h5>
          <p>Temporary password:</p>

          <div className="d-flex gap-2 align-items-center">
            <code>{temporaryPassword}</code>

            <Button
              type="button"
              onClick={() => navigator.clipboard.writeText(temporaryPassword)}
            >
              Copy password
            </Button>
          </div>

          <p className="mt-3">
            Please provide this password securely to the staff member. They must
            change it on their first login.
          </p>

          <Button
            type="button"
            onClick={() => {
              setTemporaryPassword("");
              setIsCreated(false);
              setActiveModal(null);
            }}
          >
            Done
          </Button>
        </div>
      ) : (
        <Form onSubmit={handleOnSubmit}>
          {inputFields.map((input) => (
            <CustomInput
              key={input.name}
              {...input}
              onChange={handleOnChange}
            />
          ))}

          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
      )}
    </>
  );
};
