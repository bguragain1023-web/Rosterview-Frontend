import { Button, Form } from "react-bootstrap";
import { useUser } from "../../contex/UserContext";
import useForm from "../../hooks/useForm";
import { CustomInput } from "../custom/CustomInput";
import type { SubmitEvent } from "react";

export interface CreateTeamPayload {
  name: string;
  desc?: string;
}

const initialState = {
  name: "",
  desc: "",
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
      name: "desc",
      value: form.desc,
    },
  ];

  const handleOnSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
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
