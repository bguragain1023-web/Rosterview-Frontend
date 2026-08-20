import { createContext, useContext, useState } from "react";
import type { IUser } from "../types/types";

type ModalType = "addStaff" | "updateRole" | "createShift" | null;

interface UserContextType {
  user: IUser | undefined;
  setUser: React.Dispatch<React.SetStateAction<IUser | undefined>>;
  setActiveModal: React.Dispatch<React.SetStateAction<ModalType>>;
  activeModal: ModalType | null;
  allUsers: IUser[];
  setAllUsers: React.Dispatch<React.SetStateAction<IUser[]>>;
  setEditUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  editUser: IUser | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser | undefined>(undefined);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [editUser, setEditUser] = useState<IUser | null>(null);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        setActiveModal,
        activeModal,
        allUsers,
        setAllUsers,
        editUser,
        setEditUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("UseUser must be within the UserProvider");
  }
  return context;
};
