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

const authHeader = () => ({ Authorization: `Bearer ${getAccessJWT()}` });

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
export const getAllTeams = async (): Promise<GetAllTeamResponse | ApiError> => {
  const obj = {
    method: "get",
    url: baseURL + "/teams/getteams",
    headers: {
      Authorization: `Bearer ${getAccessJWT()}`,
    },
  };
  return apiProcessor(obj);
};

// ---------- Staff detail ----------

// A single user, as returned by GET /users/:id
export interface IUserDetail {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  roleId: string;
  role: userRole | null;
  team: { _id: string; name: string } | null;
  mustChangePassword: boolean;
  passwordChangedAt?: string;
  createdAt: string;
  updatedAt: string;
  rolePermissions: string[]; // from the role, cannot be removed per user
  additionalPermissions: string[]; // extra, given to this user only
}

export interface IPermission {
  _id: string;
  name: string; // e.g. "client:read"
  resource: string; // e.g. "client"
  action: string; // e.g. "read"
  description: string;
}

// Only send the fields that changed. "team" is the team NAME (backend looks it up by name).
export interface UpdateStaffPayload {
  name?: string;
  email?: string;
  phone?: string;
  role?: userRole;
  status?: "active" | "inactive";
  team?: string;
}

export interface GetUserDetailResponse {
  status: "success";
  message: string;
  userDetail: IUserDetail;
}

export interface GetAllPermissionsResponse {
  status: "success";
  message: string;
  permissions: IPermission[];
}

export const getUserDetail = async (
  id: string,
): Promise<GetUserDetailResponse | ApiError> => {
  return apiProcessor({
    method: "get",
    url: `${baseURL}/users/${id}`,
    headers: authHeader(),
  });
};

export const getAllPermissions = async (): Promise<
  GetAllPermissionsResponse | ApiError
> => {
  return apiProcessor({
    method: "get",
    url: `${baseURL}/permissions`,
    headers: authHeader(),
  });
};

export const updateStaff = async (
  id: string,
  data: UpdateStaffPayload,
): Promise<StatusMessageOnly> => {
  return apiProcessor({
    method: "patch",
    url: `${baseURL}/users/updateuser/${id}`,
    data,
    headers: authHeader(),
  });
};

export const updateStaffPermissions = async (
  id: string,
  permissionNames: string[],
): Promise<StatusMessageOnly> => {
  return apiProcessor({
    method: "patch",
    url: `${baseURL}/users/updateuser/${id}/permissions`,
    data: { permissionNames },
    headers: authHeader(),
  });
};

// ---------- Shifts ----------

export type ShiftStatus = "unassigned" | "assigned" | "completed" | "cancelled";

export interface IShift {
  _id: string;
  workerId: string | null;
  clientId: string;
  location: string;
  date: string; // ISO, UTC midnight
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"; earlier than startTime = overnight
  breakMinutes: number;
  totalHours: number;
  status: ShiftStatus;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Only set while status is "cancelled"
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
}

export interface CreateShiftPayload {
  clientId: string;
  workerId?: string; // left out = unassigned
  location: string;
  date: string; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  breakMinutes: number;
  notes?: string;
}

export interface CreateShiftResponse {
  status: "success";
  message: string;
  shift: IShift;
  weeklyHours: number;
  normalHours: number;
  overtimeHours: number;
}

export interface GetShiftsResponse {
  status: "success";
  message: string;
  allShifts: IShift[];
}

// from/to are "YYYY-MM-DD", both inclusive and optional.
export const getShifts = async (range: {
  from?: string;
  to?: string;
} = {}): Promise<GetShiftsResponse | ApiError> => {
  const query = new URLSearchParams();
  if (range.from) query.set("from", range.from);
  if (range.to) query.set("to", range.to);
  const qs = query.toString();

  return apiProcessor({
    method: "get",
    url: `${baseURL}/shifts${qs ? `?${qs}` : ""}`,
    headers: authHeader(),
  });
};

// Only send fields that changed. workerId null = unassign.
export type UpdateShiftPayload = Partial<
  Omit<CreateShiftPayload, "workerId">
> & {
  workerId?: string | null;
};

export interface UpdateShiftResponse {
  status: "success";
  message: string;
  weeklyHours: number;
  normalHours: number;
  overtimeHours: number;
}

export const updateShift = async (
  id: string,
  data: UpdateShiftPayload,
): Promise<UpdateShiftResponse | ApiError> => {
  return apiProcessor({
    method: "patch",
    url: `${baseURL}/shifts/${id}`,
    data,
    headers: authHeader(),
  });
};

export const cancelShift = async (
  id: string,
  reason?: string,
): Promise<StatusMessageOnly> => {
  return apiProcessor({
    method: "patch",
    url: `${baseURL}/shifts/${id}/cancel`,
    data: reason ? { reason } : {},
    headers: authHeader(),
  });
};

// unassign: reinstate without the worker (e.g. they're no longer free)
export const reinstateShift = async (
  id: string,
  unassign = false,
): Promise<StatusMessageOnly> => {
  return apiProcessor({
    method: "patch",
    url: `${baseURL}/shifts/${id}/reinstate`,
    data: { unassign },
    headers: authHeader(),
  });
};

export const deleteShifts = async (
  shiftIds: string[],
): Promise<StatusMessageOnly> => {
  return apiProcessor({
    method: "delete",
    url: `${baseURL}/shifts`,
    data: { shiftIds },
    headers: authHeader(),
  });
};

// ---------- Shift swaps ----------

export type SwapStatus =
  | "pending" // waiting for the other worker
  | "workerAccepted" // waiting for a manager
  | "accepted"
  | "rejected"
  | "cancelled";

// Shift details as filled in on a swap request
export interface SwapShiftInfo {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  clientId: string;
  status: ShiftStatus;
}

export interface PersonRef {
  _id: string;
  name: string;
}

export interface ISwapRequest {
  _id: string;
  status: SwapStatus;
  // null if the shift or user has since been deleted
  requestedShiftId: SwapShiftInfo | null;
  targetedShiftId: SwapShiftInfo | null;
  requestedBy: PersonRef | null;
  requestedTo: PersonRef | null;
  reviewedBy?: PersonRef | null;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetSwapRequestsResponse {
  status: "success";
  message: string;
  swapRequests: ISwapRequest[];
}

export const getSwapRequests = async (
  statuses?: SwapStatus[],
): Promise<GetSwapRequestsResponse | ApiError> => {
  const qs = statuses?.length ? `?status=${statuses.join(",")}` : "";
  return apiProcessor({
    method: "get",
    url: `${baseURL}/swapShift${qs}`,
    headers: authHeader(),
  });
};

// Manager decision. comment is optional (max 500 chars).
export const reviewSwapRequest = async (
  id: string,
  action: "accept" | "reject",
  comment?: string,
): Promise<StatusMessageOnly> => {
  return apiProcessor({
    method: "patch",
    url: `${baseURL}/swapShift/${id}/review`,
    data: comment ? { action, comment } : { action },
    headers: authHeader(),
  });
};

// ---------- Leave requests ----------

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveType = "annual" | "personal" | "sick" | "unpaid" | "other";

export interface ILeaveRequest {
  _id: string;
  workerId: PersonRef | null; // null if the user was deleted
  startDate: string; // ISO, UTC midnight
  endDate: string; // ISO, UTC midnight (inclusive)
  type: LeaveType;
  reason?: string;
  status: LeaveStatus;
  reviewedBy?: PersonRef | null;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetLeaveRequestsResponse {
  status: "success";
  leaveRequests: ILeaveRequest[];
}

export interface ReviewLeaveResponse {
  status: "success";
  message: string;
  unassignedShifts: number;
}

export const getLeaveRequests = async (): Promise<
  GetLeaveRequestsResponse | ApiError
> => {
  return apiProcessor({
    method: "get",
    url: `${baseURL}/leaverequest`,
    headers: authHeader(),
  });
};

// unassignShifts: when approving, free up the worker's shifts during the leave.
export const reviewLeaveRequest = async (
  id: string,
  status: "approved" | "rejected",
  reviewComment?: string,
  unassignShifts?: boolean,
): Promise<ReviewLeaveResponse | ApiError> => {
  return apiProcessor({
    method: "patch",
    url: `${baseURL}/leaverequest/${id}/review`,
    data: {
      status,
      ...(reviewComment ? { reviewComment } : {}),
      ...(unassignShifts !== undefined ? { unassignShifts } : {}),
    },
    headers: authHeader(),
  });
};

export const createShift = async (
  data: CreateShiftPayload,
): Promise<CreateShiftResponse | ApiError> => {
  return apiProcessor({
    method: "post",
    url: `${baseURL}/shifts/createshift`,
    data,
    headers: authHeader(),
  });
};
