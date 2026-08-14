import { useState, type SubmitEvent } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { loginUser } from "../../helper/axios";
import { toast } from "react-toastify";
import type { LoginPayload } from "../../types/types";
import { useUser } from "../../contex/UserContext";
import { useNavigate } from "react-router-dom";

export const LoginForm = () => {
  const [form, setForm] = useState<LoginPayload>({ email: "", password: "" });
  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleOnSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    console.log("submit fired");
    e.preventDefault();
    const pendingState = loginUser(form);
    toast.promise(pendingState, {
      pending: "Please wait",
    });
    const { status, message, userDetail, accessJWT } = await pendingState;
    toast[status](message);
    if (status === "success" && accessJWT) {
      localStorage.setItem("accessJWT", accessJWT);
      setUser(userDetail);

      if (userDetail?.role === "coordinator") {
        navigate("/admin");
      } else {
        navigate("/staff");
      }
    }
  };

  return (
    <div className="form-edit">
      <Form onSubmit={handleOnSubmit}>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            name="email"
            onChange={handleOnChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            name="password"
            onChange={handleOnChange}
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </div>
  );
};
