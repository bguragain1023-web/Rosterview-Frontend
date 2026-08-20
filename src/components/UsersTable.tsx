import Table from "react-bootstrap/Table";
import { Button } from "react-bootstrap";
import { useUser } from "../contex/UserContext";
import type { IUser } from "../types/types";
import { useEffect } from "react";

export const UsersTable = () => {
  const { allUsers, setActiveModal, editUser, setEditUser } = useUser();

  const handleOnUpdate = (user: IUser) => {
    setActiveModal("updateRole");
    setEditUser(user);
  };

  useEffect(() => {
    console.log("Updated editTransaction state:", editUser);
  }, [editUser]);
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>#</th>
          <th>Full Name</th>
          <th>Email</th>
          <th>Phone Number</th>
          <th colSpan={2}>Role</th>
        </tr>
      </thead>
      <tbody>
        {allUsers.map((user, i) => (
          <tr key={user._id}>
            <td>{i + 1}</td>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.phone}</td>
            <td>{user.role}</td>
            <td>
              <Button size="sm" onClick={() => handleOnUpdate(user)}>
                Update
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
