
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE;

const MONTH_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const BAR_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc", "#e879f9", "#f0abfc"];

const quickLinks = [
  { label: "Kelola Event", desc: "Buat, edit, & hapus event", href: "/event", gradient: "from-indigo-500 to-indigo-600" },
  { label: "Kelola Tiket", desc: "Atur kuota & harga tiket", href: "/ticket", gradient: "from-purple-500 to-purple-600" },
  { label: "Transaksi", desc: "Pantau semua pembayaran", href: "/transactions", gradient: "from-sky-500 to-sky-600" },
  { label: "Customers", desc: "Data & riwayat pembeli", href: "/customers", gradient: "from-emerald-500 to-emerald-600" },
  { label: "Laporan", desc: "Ekspor CSV & analitik", href: "/report", gradient: "from-amber-500 to-amber-600" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingRaw {
  id: string;
  display_id: string | null;
  quantity: number | null;
  status: string;
  total_price: string | null;
  final_price: string | null;
  createdAt: string;
  user: { id: string; full_name: string } | null;
  event: { id: string; title: string } | null;
  ticket: { id: string; type: string; price: string } | null;
}

interface EventRaw {
  id: string;
  title: string;
  status: string;
  available_seats: number;
  createdAt: string;
}

interface UserRaw {
  id: string;
  role: string[];
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatShort(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1).replace(".", ",")}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace(".", ",")}jt`;
  return "Rp " + n.toLocaleString("id-ID");
}

function mapStatus(s: string): string {
  if (s === "DONE") return "Berhasil";
  if (s === "REJECTED" || s === "CANCELLED" || s === "EXPIRED") return "Gagal";
  return "Pending";
}

const statusStyle: Record<string, string> = {
  Berhasil: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Gagal: "bg-rose-100 text-rose-700",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [bookings, setBookings] = useState<BookingRaw[]>([]);
  const [events, setEvents] = useState<EventRaw[]>([]);
  const [users, setUsers] = useState<UserRaw[]>([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") ?? "{}");
    const organizerId: string = user?.id ?? "";
    const qs = organizerId ? `?organizer_id=${organizerId}` : "";
    Promise.all([
      fetch(`${API_BASE}/bookings${qs}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${API_BASE}/events${qs}`).then((r) => r.json()),
      fetch(`${API_BASE}/users`).then((r) => r.json()),
    ])
      .then(([bData, eData, uData]) => {
        setBookings(Array.isArray(bData) ? bData : (bData.data ?? []));
        setEvents(Array.isArray(eData) ? eData : (eData.data ?? []));
        setUsers(Array.isArray(uData) ? uData : (uData.data ?? []));
      })
      .catch(console.error);
  }, []);

  // ── Date helpers ────────────────────────────────────────────────────────────
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const isThisMonth = (d: string) => { const dt = new Date(d); return dt.getMonth() === thisMonth && dt.getFullYear() === thisYear; };
  const isLastMonth = (d: string) => { const dt = new Date(d); return dt.getMonth() === lastMonth && dt.getFullYear() === lastMonthYear; };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const doneBookings = bookings.filter((b) => b.status === "DONE");
  const customers = users.filter((u) => u.role?.includes("CUSTOMERS"));

  // Stat: Total Event
  const totalEvents = events.length;
  const eventsThisMonth = events.filter((e) => isThisMonth(e.createdAt)).length;

  // Stat: Tiket Terjual
  const totalTicketsSold = doneBookings.reduce((s, b) => s + (b.quantity ?? 0), 0);
  const ticketsThisMonth = doneBookings.filter((b) => isThisMonth(b.createdAt)).reduce((s, b) => s + (b.quantity ?? 0), 0);
  const ticketsLastMonth = doneBookings.filter((b) => isLastMonth(b.createdAt)).reduce((s, b) => s + (b.quantity ?? 0), 0);
  const ticketChangePct = ticketsLastMonth > 0
    ? Math.round((ticketsThisMonth - ticketsLastMonth) / ticketsLastMonth * 100)
    : (ticketsThisMonth > 0 ? 100 : 0);

  // Stat: Transaksi
  const totalTransactions = bookings.length;
  const transactionsToday = bookings.filter((b) => b.createdAt.slice(0, 10) === todayStr).length;

  // Stat: Customer
  const totalCustomers = customers.length;
  const newCustomersThisWeek = customers.filter((u) => new Date(u.createdAt) >= weekAgo).length;

  // Stat: Pendapatan
  const grossRevenue = doneBookings.reduce((s, b) => s + Number(b.total_price ?? 0), 0);
  const netRevenue = doneBookings.reduce((s, b) => s + Number(b.final_price ?? 0), 0);
  const netThisMonth = doneBookings.filter((b) => isThisMonth(b.createdAt)).reduce((s, b) => s + Number(b.final_price ?? 0), 0);
  const netLastMonth = doneBookings.filter((b) => isLastMonth(b.createdAt)).reduce((s, b) => s + Number(b.final_price ?? 0), 0);
  const revenueChangePct = netLastMonth > 0
    ? Math.round((netThisMonth - netLastMonth) / netLastMonth * 100)
    : (netThisMonth > 0 ? 100 : 0);

  // ── Stats cards ──────────────────────────────────────────────────────────────
  const stats = [
    {
      label: "Total Event",
      value: totalEvents.toLocaleString("id-ID"),
      change: `+${eventsThisMonth} bulan ini`,
      positive: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: "bg-indigo-50 text-indigo-600",
      href: "/event",
    },
    {
      label: "Total Tiket Terjual",
      value: totalTicketsSold.toLocaleString("id-ID"),
      change: `${ticketChangePct >= 0 ? "+" : ""}${ticketChangePct}% dari bulan lalu`,
      positive: ticketChangePct >= 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      color: "bg-purple-50 text-purple-600",
      href: "/ticket",
    },
    {
      label: "Total Transaksi",
      value: totalTransactions.toLocaleString("id-ID"),
      change: `+${transactionsToday} hari ini`,
      positive: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: "bg-sky-50 text-sky-600",
      href: "/transactions",
    },
    {
      label: "Total Customer",
      value: totalCustomers.toLocaleString("id-ID"),
      change: `+${newCustomersThisWeek} minggu ini`,
      positive: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.197-3.768M9 20H4v-2a4 4 0 015.197-3.768M15 11a4 4 0 10-8 0 4 4 0 008 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: "bg-emerald-50 text-emerald-600",
      href: "/customers",
    },
    {
      label: "Pendapatan Bersih",
      value: formatShort(netRevenue),
      change: `${revenueChangePct >= 0 ? "+" : ""}${revenueChangePct}% bulan ini`,
      positive: revenueChangePct >= 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-amber-50 text-amber-600",
      href: "/report",
    },
  ];

  // ── Charts ───────────────────────────────────────────────────────────────────
  const revenueData = (() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const sum = doneBookings
        .filter((b) => { const bd = new Date(b.createdAt); return bd.getMonth() === m && bd.getFullYear() === y; })
        .reduce((s, b) => s + Number(b.total_price ?? 0), 0);
      result.push({ bulan: MONTH_ID[m], pendapatan: sum });
    }
    return result;
  })();

  const ticketByEvent = (() => {
    const map = new Map<string, number>();
    doneBookings.forEach((b) => {
      const title = b.event?.title ?? "Lainnya";
      map.set(title, (map.get(title) ?? 0) + (b.quantity ?? 0));
    });
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([event, terjual]) => ({ event: event.length > 11 ? event.slice(0, 10) + "…" : event, terjual }));
  })();

  // ── Recent Transactions ──────────────────────────────────────────────────────
  const recentTransactions = bookings.slice(0, 5).map((b) => ({
    id: b.display_id ?? b.id.slice(0, 8).toUpperCase(),
    customer: b.user?.full_name ?? "–",
    event: b.event?.title ?? "–",
    tiket: b.ticket?.type?.replace(/_/g, " ") ?? "–",
    total: Number(b.total_price ?? 0),
    status: mapStatus(b.status),
  }));

  // ── Overview cards ───────────────────────────────────────────────────────────
  const activeEvents = events.filter((e) => e.status === "ACTIVE").length;
  const draftEvents = events.filter((e) => e.status === "DRAFT").length;
  const completedEvents = events.filter((e) => e.status === "COMPLETED").length;
  const remainingSeats = events.reduce((s, e) => s + (e.available_seats ?? 0), 0);
  const doneCount = doneBookings.length;
  const pendingCount = bookings.filter((b) => ["PENDING", "WAITING_FOR_PAYMENTS", "WAITING_FOR_CONFIRMATION"].includes(b.status)).length;
  const failedCount = bookings.filter((b) => ["REJECTED", "CANCELLED", "EXPIRED"].includes(b.status)).length;
  const newCustomersThisMonth = customers.filter((u) => isThisMonth(u.createdAt)).length;

  const overviewCards = [
    {
      title: "Event", href: "/event", icon: "🗓️", accentBg: "bg-indigo-500",
      metrics: [
        { label: "Aktif", value: activeEvents.toLocaleString("id-ID") },
        { label: "Draft", value: draftEvents.toLocaleString("id-ID") },
        { label: "Selesai", value: completedEvents.toLocaleString("id-ID") },
      ],
    },
    {
      title: "Tiket", href: "/ticket", icon: "🎟️", accentBg: "bg-purple-500",
      metrics: [
        { label: "Terjual", value: totalTicketsSold.toLocaleString("id-ID") },
        { label: "Tersisa", value: remainingSeats.toLocaleString("id-ID") },
        { label: "Event", value: totalEvents.toLocaleString("id-ID") },
      ],
    },
    {
      title: "Transaksi", href: "/transactions", icon: "📋", accentBg: "bg-sky-500",
      metrics: [
        { label: "Berhasil", value: doneCount.toLocaleString("id-ID") },
        { label: "Pending", value: pendingCount.toLocaleString("id-ID") },
        { label: "Gagal", value: failedCount.toLocaleString("id-ID") },
      ],
    },
    {
      title: "Customers", href: "/customers", icon: "👥", accentBg: "bg-emerald-500",
      metrics: [
        { label: "Total", value: totalCustomers.toLocaleString("id-ID") },
        { label: "Baru (bln)", value: newCustomersThisMonth.toLocaleString("id-ID") },
        { label: "Minggu ini", value: newCustomersThisWeek.toLocaleString("id-ID") },
      ],
    },
    {
      title: "Laporan", href: "/report", icon: "📊", accentBg: "bg-amber-500",
      metrics: [
        { label: "Pendapatan", value: formatShort(netRevenue).replace("Rp ", "") },
        { label: "Pajak", value: formatShort(grossRevenue * 0.1).replace("Rp ", "") },
        { label: "Fee", value: formatShort(grossRevenue * 0.05).replace("Rp ", "") },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Selamat datang kembali! Berikut ringkasan aktivitas Anda hari ini.</p>
        </div>
        <span className="text-xs text-gray-400 bg-white border border-gray-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
            <p className={`text-xs font-semibold ${s.positive ? "text-emerald-600" : "text-rose-600"}`}>
              {s.change}
            </p>
          </Link>
        ))}
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Area – monthly revenue */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-gray-800">Tren Pendapatan</h2>
              <p className="text-xs text-gray-500 mt-0.5">6 bulan terakhir</p>
            </div>
            <Link to="/report" className="text-xs text-indigo-600 font-semibold hover:underline">Lihat Laporan →</Link>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                  formatter={(val) => [formatRupiah(Number(val))]}
                />
                <Area type="monotone" dataKey="pendapatan" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGradient)" dot={{ r: 3, fill: "#6366f1" }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar – tickets per event */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-gray-800">Tiket Terjual per Event</h2>
              <p className="text-xs text-gray-500 mt-0.5">Top 6 event aktif</p>
            </div>
            <Link to="/ticket" className="text-xs text-indigo-600 font-semibold hover:underline">Lihat Tiket →</Link>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketByEvent} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="event" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                  formatter={(val) => [`${val} tiket`]}
                />
                <Bar dataKey="terjual" radius={[6, 6, 0, 0]}>
                  {ticketByEvent.map((_e, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Recent Transactions + Quick Links ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Transactions (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-gray-800">Transaksi Terbaru</h2>
              <p className="text-xs text-gray-500 mt-0.5">5 transaksi terakhir</p>
            </div>
            <Link to="/transactions" className="text-xs text-indigo-600 font-semibold hover:underline">Lihat Semua →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-3 text-left font-semibold">ID</th>
                  <th className="pb-3 text-left font-semibold">Customer</th>
                  <th className="pb-3 text-left font-semibold hidden sm:table-cell">Event</th>
                  <th className="pb-3 text-right font-semibold">Total</th>
                  <th className="pb-3 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 pr-3 font-mono text-xs text-indigo-500 font-semibold">{t.id}</td>
                    <td className="py-3.5 pr-3 text-gray-700 text-sm font-medium">{t.customer}</td>
                    <td className="py-3.5 pr-3 text-gray-500 text-xs hidden sm:table-cell">{t.event}</td>
                    <td className="py-3.5 text-right font-semibold text-gray-800 text-sm">{formatRupiah(t.total)}</td>
                    <td className="py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links (1/3 width) */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-1">Navigasi Cepat</h2>
          <p className="text-xs text-gray-500 mb-5">Akses menu utama</p>
          <div className="flex flex-col gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={`flex items-center gap-4 bg-gradient-to-r ${link.gradient} text-white rounded-2xl px-4 py-3.5 hover:opacity-90 active:opacity-100 transition-opacity`}
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm">{link.label}</p>
                  <p className="text-xs opacity-75 mt-0.5">{link.desc}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 opacity-80 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page Overview Cards ──────────────────────────────────────────────── */}
      <div>
        <h2 className="font-bold text-gray-800 mb-1">Overview Halaman</h2>
        <p className="text-xs text-gray-500 mb-5">Ringkasan kondisi tiap modul</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {overviewCards.map((card) => (
            <Link
              key={card.title}
              to={card.href}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`${card.accentBg} px-5 py-4 flex items-center gap-3`}>
                <span className="text-2xl">{card.icon}</span>
                <span className="text-white font-bold text-base">{card.title}</span>
              </div>
              <div className="p-4 grid grid-cols-3 gap-2">
                {card.metrics.map((m) => (
                  <div key={m.label} className="text-center">
                    <p className="font-bold text-gray-800 text-sm">{m.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{m.label}</p>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
