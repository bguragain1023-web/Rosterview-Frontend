import { getLoggedInUser, type IUser } from "../helper/axios";

export const autoLogin = async (): Promise<IUser | null> => {
  const accessJWT = localStorage.getItem("accessJWT");

  if (!accessJWT) {
    return null;
  }
  const response = await getLoggedInUser();
  if (!response || response.status !== "success" || !response.userDetail) {
    return null;
  }
  return response.userDetail;
};
