import { Button, Form } from "react-bootstrap";
import { useUser } from "../../contex/UserContext";
import useForm from "../../hooks/useForm";
import { CustomInput } from "../custom/CustomInput";

export interface AddClientPayload {
  name: string;
  phone: string;
  address: string;
  email: string;
  notes: string;
}

const initialState = {
  name: "",
  phone: "",
  address: "",
  email: "",
  notes: "",
};

export const AddClientForm = () => {
  const { setActiveModal } = useUser();
  const { form, setForm, handleOnChange } =
    useForm<AddClientPayload>(initialState);

  const inputFields = [
    {
      label: "Full Name",
      type: "text",
      placeholder: "eg : John Doe",
      name: "name",
      value: form.name,
    },

    {
      label: "Phone",
      type: "Number",
      placeholder: "04XXXXXXXX",
      name: "phone",
      value: form.phone,
    },
    {
      label: "Address",
      type: "text",
      placeholder: "eg : 1 street name, subhurb ",
      name: "address",
      value: form.address,
    },
    {
      label: "Email Address",
      type: "email",
      placeholder: "email@email.com",
      name: "email",
      value: form.email,
    },
    {
      label: "Notes",
      type: "textarea",
      placeholder: "optional",
      name: "notes",
      value: form.notes,
    },
  ];

  const handleOnSubmit = () => {
    console.log("Here you go");
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
