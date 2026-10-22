import { Button, Form } from "react-bootstrap";
import { useUser } from "../../contex/UserContext";
import useForm from "../../hooks/useForm";
import { CustomInput } from "../custom/CustomInput";
import type { SubmitEvent } from "react";
import { addNewTeam } from "../../helper/axios";
import { toast } from "react-toastify";

export interface CreateTeamPayload {
  name: string;
  description?: string;
}

const initialState = {
  name: "",
  description: "",
};

export const CreateTeamForm = () => {
  const { setActiveModal } = useUser();
  const { form, handleOnChange, setForm } =
    useForm<CreateTeamPayload>(initialState);

  const inputFields = [
    {
      label: "Team Name",
      type: "text",
      placeholder: "eg : Team A ",
      name: "name",
      value: form.name,
    },

    {
      label: "Description",
      type: "text",
      placeholder: "eg : desc",
      name: "description",
      value: form.description,
    },
  ];

  const handleOnSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const pendingState = addNewTeam(form);
    toast.promise(pendingState, {
      pending: "Creating New Team. Please wait",
    });

    const response = await pendingState;
    toast[response.status](response.message);

    if (response.status === "success") {
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
