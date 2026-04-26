import { NavLink, Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  Tag,
  ClipboardList,
  BarChart2,
  Users,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { getUserFromCookie, removeUserCookie } from "../utils/auth";

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "Manajemen Event",
    path: "/event",
    icon: <CalendarDays className="w-5 h-5" />,
  },
  {
    label: "Manajemen Tiket",
    path: "/ticket",
    icon: <Ticket className="w-5 h-5" />,
  },
  {
    label: "Promo & Diskon",
    path: "/promos",
    icon: <Tag className="w-5 h-5" />,
  },
  {
    label: "Penjualan & Transaksi",
    path: "/transactions",
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    label: "Daftar Peserta",
    path: "/attendees",
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: "Laporan",
    path: "/report",
    icon: <BarChart2 className="w-5 h-5" />,
  },
];

const breadcrumbLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/event": "Manajemen Event",
  "/ticket": "Manajemen Tiket",
  "/promos": "Promo & Diskon",
  "/transactions": "Penjualan & Transaksi",
  "/attendees": "Daftar Peserta",
  "/report": "Laporan",
  
};

export default function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingConfirmCount, setPendingConfirmCount] = useState(0);
  const pageLabel = breadcrumbLabels[location.pathname] ?? "Beranda";

  const [user, setUser] = useState(() => getUserFromCookie());

  // Keep user in sync with cookie changes (e.g. avatar update)
  useEffect(() => {
    const onStorage = () => {
      setUser(getUserFromCookie());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Fetch pending confirmation count for badge
  useEffect(() => {
    const orgId = user?.id;
    if (!orgId) return;
    fetch(`${import.meta.env.VITE_API_BASE}/bookings?organizer_id=${orgId}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const count = (res.data as any[]).filter(
            (b) => b.status === "WAITING_FOR_CONFIRMATION"
          ).length;
          setPendingConfirmCount(count);
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    fetch(`${import.meta.env.VITE_API_BASE}/users/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    removeUserCookie();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex-none bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <Ticket className="w-8 h-8 text-orange-500 flex-none" />
          <span className="text-base font-extrabold text-orange-500 tracking-widest uppercase leading-none">
            Lokahajat
          </span>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600 p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-orange-500 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.path === "/transactions" && pendingConfirmCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                  {pendingConfirmCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User profile */}
        <div className="px-4 py-4 border-t border-gray-100">
          <Link
            to="/admin"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 w-full rounded-lg hover:bg-gray-100 px-1 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full flex-none overflow-hidden">
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-orange-500 flex items-center justify-center text-xs font-semibold text-white">
                  {user?.full_name
                    ? user.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
                    : "?"}
                </div>
              )}
            </div>
            {user && (
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{user.role}</p>
              </div>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400 flex-none" />
          </Link>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top header bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-none">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Home className="w-4 h-4 hidden sm:block" />
              <span className="hidden sm:block">Beranda</span>
              <span className="text-gray-300 hidden sm:block">/</span>
              <span className="text-gray-800 font-medium">{pageLabel}</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
                       
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}