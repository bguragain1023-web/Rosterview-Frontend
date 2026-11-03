import type { userRole } from "../helper/axios";

const roleLabels: Record<userRole, string> = {
  admin: "Admin",
  coordinator: "Coordinator",
  teamLeader: "Team Leader",
  worker: "Worker",
};

export const roleLabel = (role: userRole | null) =>
  role ? roleLabels[role] : "No role";

// e.g. "3 Nov 2026"
export const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

// "John Doe" -> "JD"
export const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
