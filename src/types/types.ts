import type { IUser } from "../helper/axios";

export interface GetMeResponse {
  status: "success" | "error";
  message: string;
  userDetail: IUser;
}
