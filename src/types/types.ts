//axios

export interface ProcessorPayload {
  method: string;
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
}

// login

export interface LoginResponse {
  status: "success" | "error";
  message: string;
  userDetail?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: "coordinator" | "worker";
  };
  accessJWT?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface IUser {
  name: string;
  _id: string;
  email: string;
  phone: string;
  role: "coordinator" | "worker";
}

export interface GetUserResponse {
  status: "success" | "error";
  message: string;
  user?: IUser;
}

export interface GetAllUSersResponse {
  status: "success" | "error";
  message: string;
  users: IUser[];
}

export interface SidebarAction {
  id: string;
  label: string;
  onClick: () => void;
}

export interface AddStaffPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
}

export interface UpdateStaffPayload {
  name: string;
  email: string;
  role: "coordinator" | "worker" | "";
  phone: string;
}
