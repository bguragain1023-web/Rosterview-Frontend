import useForm from "../hooks/useForm";
import { CustomInput } from "../components/custom/CustomInput";
import { Button, Form } from "react-bootstrap";
import { type SubmitEvent } from "react";
import { toast } from "react-toastify";
import { changePassword } from "../helper/axios";
import { useUser } from "../contex/UserContext";
import { useNavigate } from "react-router-dom";

const initialState = {
  newPassword: "",
  confirmPassword: "",
};

export const ChangePassword = () => {
  const { form, handleOnChange } = useForm(initialState);
  const { user } = useUser();
  const navigate = useNavigate();

  const inputFields = [
    {
      label: "New Password",
      type: "password",
      Placeholder: "*********",
      name: "newPassword",
      value: form.newPassword,
    },
    {
      label: "Confirm Password",
      type: "password",
      Placeholder: "*********",
      name: "confirmPassword",
      value: form.confirmPassword,
    },
  ];

  const handleOnSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match");
    }
    const data = {
      newPassword: form.newPassword,
    };
    const pendingState = changePassword(data);
    toast.promise(pendingState, {
      pending: "Please wait...",
    });

    const result = await pendingState;
    const { status, message } = result;
    if (status === "success") {
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "coordinator") {
        navigate("/coordinator");
      } else if (user.role === "teamLeader") {
        navigate("/teamleader");
      } else if (user.role === "worker") {
        navigate("/worker");
      }
    }

    toast[status](message);
  };

  return (
    <>
      <div className="layoutWrapper d-flex align-items-center justify-content-center flex-column">
        <div className="title">Change Password</div>
        <div className="loginbox mt-3">
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
        </div>
      </div>
    </>
  );
};
