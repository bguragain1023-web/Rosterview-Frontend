import { Container } from "react-bootstrap";
import { useLocation } from "react-router-dom";

export const StaffDetailPage = () => {
  const location = useLocation();

  const user = location.state?.user;
  return (
    <Container>
      <div className="layoutWrapper">
        <div className="title text-center p-3">{user.name}</div>

        <div className="detail d-flex flex-column gap-3 p-4">
          <div className="userDetail">Email: {user.email}</div>
          <div className="userDetail">phone: {user.phone}</div>
          <div className="userDetail">Role: {user.role}</div>
          <div className="userDetail">Team: {user.teamId ?? "n/a"}</div>
          <div className="userDetail">Status: {user.status ?? "n/a"}</div>
          <div className="userDetail">
            Permissions: {user.additionalPermissions}
          </div>
        </div>
      </div>
    </Container>
  );
};
