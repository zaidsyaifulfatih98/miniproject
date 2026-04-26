import { Navigate, Outlet } from "react-router-dom";
import { getUserFromCookie } from "../utils/auth";

export default function OrganizerGuard() {
  const user = getUserFromCookie();
  console.log(user)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!Array.isArray(user.role) || !user.role.includes("ORGANIZER")) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
