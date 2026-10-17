import type { IUser } from "../helper/axios";

export interface GetMeResponse {
  status: "success";
  message: string;
  userDetail: IUser;
}
