import axios, { isAxiosError } from "axios";
import type { GetMeResponse } from "../types/types";
import type { AddStaffPayload } from "../components/forms/AddStaffForm";
import type { AddClientPayload } from "../components/forms/AddClientForm";
import type { CreateTeamPayload } from "../components/forms/CreateTeamForm";

export interface LoginPayload {
  email: string;
  password: string;
}
export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  status: "active" | "inactive";
  teamId?: string;
  mustChangePassword: boolean;
  passwordChangedAt?: string;
  additionalPermissions: string[];
  role: userRole;
}
export interface IClient {
  _id: string;
  name: string;
  phone: string;
  address: string;
  email: string;
  notes?: string;
  isActive: boolean;
  createdBy: string;
}

export interface ITeam {
  _id: string;
  name: string;
  normalizedName: string;
  description: string;
  teamLeaderId?: string | null;
  isActive: boolean;
}

export interface LoginSuccess {
  status: "success";
  message: string;
  userDetail: IUser;
  accessJWT: string;
}

export interface AddUserResponse {
  status: "success";
  message: string;
  userDetail: IUser;
  tempPassword: string;
}
export interface AddClientResponse {
  status: "success";
  message: string;
  client: IClient;
}

export interface AddTeamResponse {
  status: "success";
  message: string;
  team: ITeam;
}

export interface GetAllUsersResponse {
  status: "success";
  message: string;
  allUsers: IUser[];
}

export interface ProcessorPayload {
  method: string;
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
}

export interface ChangePasswordPayload {
  newPassword: string;
}

export interface StatusMessageOnly {
  status: "success" | "error";
  message: string;
}
export interface ApiError {
  status: "error";
  message: string;
}

export type userRole = "admin" | "coordinator" | "teamLeader" | "worker";

const baseURL = import.meta.env.VITE_ROOT_API + "/api/v1";

const getAccessJWT = () => {
  return localStorage.getItem("accessJWT");
};

const apiProcessor = async <T>({
  method,
  url,
  data,
  headers,
}: ProcessorPayload): Promise<T | ApiError> => {
  console.log("apiProcessor called with:", { method, url, data });
  try {
    const response = await axios({
      method,
      url,
      data,
      headers,
    });
    return response.data as T;
  } catch (error) {
    console.log("apiProcessor caught error:", error);
    if (isAxiosError(error)) {
      return {
        status: "error",
        message: error.response?.data?.message || error.message,
      };
    }
    return {
      status: "error",
      message: "An unexpected error occured",
    };
  }
};

//login user
export const loginUser = async (
  data: LoginPayload,
): Promise<LoginSuccess | ApiError> => {
  const obj = {
    method: "post",
    url: baseURL + "/users/login",
    data,
  };
  return apiProcessor(obj);
};

//chnage Password
export const changePassword = async (
  data: ChangePasswordPayload,
): Promise<StatusMessageOnly> => {
  const obj = {
    method: "patch",
    url: baseURL + "/users/change-password",
    data,
    headers: {
      Authorization: `Bearer ${getAccessJWT()}`,
    },
  };
  return apiProcessor(obj);
};

export const getLoggedInUser = async (): Promise<GetMeResponse | ApiError> => {
  const obj = {
    method: "get",
    url: baseURL + "/users/me",
    headers: {
      Authorization: `Bearer ${getAccessJWT()}`,
    },
  };

  return apiProcessor(obj);
};

export const addNewUser = async (
  data: AddStaffPayload,
): Promise<AddUserResponse | ApiError> => {
  const obj = {
    method: "post",
    url: baseURL + "/users/createuser",
    data,
    headers: {
      Authorization: `Bearer ${getAccessJWT()}`,
    },
  };

  return apiProcessor(obj);
};

export const addNewClient = async (
  data: AddClientPayload,
): Promise<AddClientResponse | ApiError> => {
  const obj = {
    method: "post",
    url: baseURL + "/clients/createclient",
    data,
    headers: {
      Authorization: `Bearer ${getAccessJWT()}`,
    },
  };
  return apiProcessor(obj);
};

export const addNewTeam = async (
  data: CreateTeamPayload,
): Promise<AddTeamResponse | ApiError> => {
  const obj = {
    method: "post",
    url: baseURL + "/teams/createteam",
    data,
    headers: {
      Authorization: `Bearer ${getAccessJWT()}`,
    },
  };
  return apiProcessor(obj);
};

export const getAllUsers = async (): Promise<
  GetAllUsersResponse | ApiError
> => {
  const obj = {
    method: "get",
    url: baseURL + "/users/readuser",
    headers: {
      Authorization: `Bearer ${getAccessJWT()}`,
    },
  };
  return apiProcessor(obj);
};

export interface GetAllClientsResponse {
  status: "success";
  message: string;
  clients: IClient[];
}
export const getAllClients = async (): Promise<
  GetAllClientsResponse | ApiError
> => {
  const obj = {
    method: "get",
    url: baseURL + "/clients/",
    headers: {
      Authorization: `Bearer ${getAccessJWT()}`,
    },
  };
  return apiProcessor(obj);
};

export interface GetAllTeamResponse {
  status: "success";
  message: string;
  teams: ITeam[];
}
export const getAllTeams = async () => {
  const obj = {
    method: "get",
    url: baseURL + "/teams/getteams",
    headers: {
      Authorization: `Bearer ${getAccessJWT()}`,
    },
  };
  return apiProcessor(obj);
};
