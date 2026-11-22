import { Button, Form } from "react-bootstrap";
import { useUser } from "../../contex/UserContext";
import useForm from "../../hooks/useForm";
import { CustomInput } from "../custom/CustomInput";
import { useEffect, useState, type SubmitEvent } from "react";
import { addNewClient, getAllTeams, type ITeam } from "../../helper/axios";
import { toast } from "react-toastify";

export interface AddClientPayload {
  name: string;
  phone: string;
  address: string;
  email: string;
  notes: string;
  teamId: string; // the client's area
}

const initialState = {
  name: "",
  phone: "",
  address: "",
  email: "",
  notes: "",
  teamId: "",
};

export const AddClientForm = () => {
  const { setActiveModal } = useUser();
  const { form, setForm, handleOnChange } =
    useForm<AddClientPayload>(initialState);
  const [teams, setTeams] = useState<ITeam[]>([]);

  // Active teams only: the backend won't accept an inactive one.
  useEffect(() => {
    let ignore = false;
    getAllTeams().then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setTeams(res.teams.filter((t) => t.isActive));
      } else {
        toast.error(res.message);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

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

  const handleOnSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("client form ", form);
    const pendingState = addNewClient(form);
    toast.promise(pendingState, {
      pending: "Adding New client.. Please wait !!",
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

      <Form.Group className="mb-3" controlId="clientTeam">
        <Form.Label>Team (area)</Form.Label>
        <Form.Select
          name="teamId"
          value={form.teamId}
          onChange={handleOnChange}
          required
        >
          <option value="" disabled>
            Select a team
          </option>
          {teams.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </Form.Select>
        <Form.Text className="mutedDate">
          Only workers in this team can be assigned to this client's shifts.
        </Form.Text>
      </Form.Group>

      <Button variant="primary" type="submit">
        Submit
      </Button>
    </Form>
  );
};
