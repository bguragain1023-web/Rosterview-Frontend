import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../../contex/UserContext";

interface PrivateRoutesProps {
  allowedRoles?: ("admin" | "coordinator" | "teamleader" | "worker")[];
}

export const PrivateRoutes = ({ allowedRoles }: PrivateRoutesProps) => {
  const { user } = useUser();
  console.log("USER:", user);
  console.log("USER ROLE:", user?.role);
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};
