import axios, { isAxiosError } from "axios";
import type { GetMeResponse } from "../types/types";

export interface LoginPayload {
  email: string;
  password: string;
}
export interface IUser {
  name: string;
  email: string;
  phone: string;
  roleId: string;
  status: "active" | "inactive";
  teamId?: string;
  mustChangePassword: boolean;
  passwordChangedAt?: string;
  additionalPermissions: string[];
  role: string;
}

export interface LoginResponse {
  status: "success" | "error";
  message: string;
  userDetail?: IUser;
  accessJWT?: string;
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

export type userRole = "admin" | "coordinator" | "teamLeader" | "worker";

const baseURL = import.meta.env.VITE_ROOT_API + "/api/v1";

const getAccessJWT = () => {
  return localStorage.getItem("accessJWT");
};

const apiProcessor = async ({
  method,
  url,
  data,
  headers,
}: ProcessorPayload) => {
  console.log("apiProcessor called with:", { method, url, data });
  try {
    const response = await axios({
      method,
      url,
      data,
      headers,
    });
    return response.data;
  } catch (error) {
    console.log("apiProcessor caught error:", error);
    if (isAxiosError(error)) {
      return {
        status: "error",
        message: error.response?.data?.error || error.message,
      };
    }
    return {
      status: "error",
      message: "An unexpected error occured",
    };
  }
};

//login user
export const loginUser = async (data: LoginPayload): Promise<LoginResponse> => {
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

export const getLoggedInUser = async (): Promise<GetMeResponse | null> => {
  const obj = {
    method: "get",
    url: baseURL + "/users/me",
    headers: {
      Authorization: `Bearer ${getAccessJWT()}`,
    },
  };

  return apiProcessor(obj);
};
