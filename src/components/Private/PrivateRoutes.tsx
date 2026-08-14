import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../../contex/UserContext"


export const PrivateRoutes = () => {
    const {user } = useUser();
  return user ? <Outlet/> : <Navigate to = "/" replace />
};
