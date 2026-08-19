import axios, { isAxiosError } from "axios";
import type {
  AddStaffPayload,
  GetUserResponse,
  LoginPayload,
  LoginResponse,
  ProcessorPayload,
} from "../types/types";

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

// fetch user

export const getUser = async (): Promise<GetUserResponse> => {
  const users = {
    method: "get",
    url: baseURL + "/users",
    headers: {
      Authorization: `Bearer ${getAccessJWT()}`,
    },
  };
  return apiProcessor(users);
};

//add new staff
export const addNewStaff = (
  data: AddStaffPayload,
): Promise<GetUserResponse> => {
  const users = {
    method: "post",
    url: baseURL + "/coordinator",
    data,
    headers: {
      Authorization: `Bearer ${getAccessJWT()}`,
    },
  };
  return apiProcessor(users);
};
