import useForm from "../hooks/useForm";
import { CustomInput } from "../components/custom/CustomInput";
import { Button, Form } from "react-bootstrap";

const initialState = {
  newPassword: "",
  confirmPassword: "",
};

export const ChangePassword = () => {
  const { form, handleOnChange } = useForm(initialState);

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
  return (
    <>
      <div className="layoutWrapper d-flex align-items-center justify-content-center flex-column">
        <div className="title">Change Password</div>
        <div className="loginbox mt-3">
          <Form>
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
