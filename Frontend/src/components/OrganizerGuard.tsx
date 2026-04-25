import { Navigate, Outlet } from "react-router-dom";

export default function OrganizerGuard() {
  const stored = localStorage.getItem("user");
  console.log(stored)
  if (!stored) {
    return <Navigate to="/login" replace />;
  }

  let user: { id?: string; role?: string[] } | null = null;
  try {
    user = JSON.parse(stored);
  } catch {
    return <Navigate to="/login" replace />;
  }

  if (!user || !Array.isArray(user.role) || !user.role.includes("ORGANIZER")) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
