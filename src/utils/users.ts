import { getUser } from "../helper/axios";
import type { IUser } from "../types/types";

export const autoLogin = async (): Promise<IUser | null> => {
  const accessJWT = localStorage.getItem("accessJWT");
  console.log("autoLogin - token found:", accessJWT);

  if (!accessJWT) {
    return null;
  }
  const { status, user } = await getUser();
  console.log("autoLogin - getUser result:", user);
  return status == "success" && user ? user : null;
};
