import { NavLink, Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  ClipboardList,
  Users,
  BarChart2,
  ChevronRight,
  Home,
  LogOut,
} from "lucide-react";

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
    label: "Penjualan & Transaksi",
    path: "/transactions",
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    label: "Customers",
    path: "/customers",
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
  "/transactions": "Penjualan & Transaksi",
  "/customers": "Manajemen Pengguna",
  "/report": "Laporan",
  
};

export default function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageLabel = breadcrumbLabels[location.pathname] ?? "Beranda";

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* ── Sidebar ── */}
      <aside className="w-60 flex-none bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <Ticket className="w-8 h-8 text-orange-500 flex-none" />
          <span className="text-base font-extrabold text-orange-500 tracking-widest uppercase leading-none">
            Lokahajat
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-orange-500 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User profile */}
        <div className="px-4 py-4 border-t border-gray-100">
          <Link
            to="/admin"
            className="flex items-center gap-3 w-full rounded-lg hover:bg-gray-100 px-1 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600 flex-none">
              BS
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-none">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Home className="w-4 h-4" />
            <span>Beranda</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-800 font-medium">{pageLabel}</span>
          </nav>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-600">
                Hai, <span className="font-semibold text-gray-800">{user.full_name}</span>
              </span>
            )}
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}