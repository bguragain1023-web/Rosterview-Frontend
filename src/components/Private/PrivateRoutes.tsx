import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../../contex/UserContext";

interface PrivateRoutesProps {
  allowedRoles?: ("admin" | "coordinator" | "teamLeader" | "worker")[];
}

export const PrivateRoutes = ({ allowedRoles }: PrivateRoutesProps) => {
  const { user, isAuthLoading } = useUser();

  if (isAuthLoading) {
    return null;
  }
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};
