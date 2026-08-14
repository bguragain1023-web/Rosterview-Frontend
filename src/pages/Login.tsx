import { Navigate } from "react-router-dom";
import { LoginForm } from "../components/forms/LoginForm";
import { useUser } from "../contex/UserContext";

export const Login = () => {
  const { user } = useUser();
  if (user?._id) {
    return (
      <Navigate
        to={user.role === "coordinator" ? "/admin" : "/staff"}
        replace
      />
    );
  }

  return (
    <div className="layoutWrapper d-flex align-items-center justify-content-center flex-column">
      <div className="title">Login</div>
      <div className="loginbox mt-3">
        <LoginForm />
      </div>
    </div>
  );
};
