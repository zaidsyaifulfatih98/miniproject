import { NavLink, Outlet, useLocation, Link } from "react-router-dom";

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Manajemen Event",
    path: "/event",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Manajemen Tiket",
    path: "/ticket",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    label: "Penjualan & Transaksi",
    path: "/transactions",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    label: "Customers",
    path: "/customers",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Laporan",
    path: "/report",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  }
  
];

const breadcrumbLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/event": "Manajemen Event",
  "/ticket": "Manajemen Tiket",
  "/transactions": "Penjualan & Transaksi",
  "/users": "Manajemen Pengguna",
  "/laporan": "Laporan",
  "/pengaturan": "Pengaturan",
};

export default function RootLayout() {
  const location = useLocation();
  const pageLabel = breadcrumbLabels[location.pathname] ?? "Beranda";

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* ── Sidebar ── */}
      <aside className="w-60 flex-none bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <svg className="w-8 h-8 text-orange-500 flex-none" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 4a2 2 0 00-2 2v3.17a.5.5 0 00.37.48A2 2 0 014.5 11.5a2 2 0 01-2.13 1.85.5.5 0 00-.37.48V17a2 2 0 002 2h16a2 2 0 002-2v-3.17a.5.5 0 00-.37-.48A2 2 0 0119.5 11.5a2 2 0 012.13-1.85.5.5 0 00.37-.48V6a2 2 0 00-2-2H4zm3 4h2a1 1 0 010 2H7a1 1 0 010-2zm4 0h6a1 1 0 010 2h-6a1 1 0 010-2zM7 13h2a1 1 0 010 2H7a1 1 0 010-2zm4 0h6a1 1 0 010 2h-6a1 1 0 010-2z" />
          </svg>
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
            to="/users"
            className="flex items-center gap-3 w-full rounded-lg hover:bg-gray-100 px-1 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600 flex-none">
              BS
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-semibold text-gray-800 truncate">Budi Santoso</p>
              <p className="text-xs text-gray-400 truncate">Admin</p>
            </div>
            <svg
              className="w-4 h-4 text-gray-400 flex-none"
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-none">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 5v6h4v-6m5 0h2a2 2 0 002-2V9a2 2 0 00-.586-1.414l-7-7a2 2 0 00-2.828 0l-7 7A2 2 0 003 9v10a2 2 0 002 2h2" />
            </svg>
            <span>Beranda</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-800 font-medium">{pageLabel}</span>
          </nav>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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