
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

// ─── Mock summary data ────────────────────────────────────────────────────────

const stats = [
  {
    label: "Total Event",
    value: "24",
    change: "+3 bulan ini",
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
    value: "4.820",
    change: "+12% dari kemarin",
    positive: true,
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
    value: "1.340",
    change: "+87 hari ini",
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
    value: "3.105",
    change: "+24 minggu ini",
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
    value: "Rp 41,4jt",
    change: "+5% bulan ini",
    positive: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "bg-amber-50 text-amber-600",
    href: "/report",
  },
];

const revenueData = [
  { bulan: "Okt", pendapatan: 18_200_000 },
  { bulan: "Nov", pendapatan: 24_500_000 },
  { bulan: "Des", pendapatan: 31_000_000 },
  { bulan: "Jan", pendapatan: 27_400_000 },
  { bulan: "Feb", pendapatan: 35_800_000 },
  { bulan: "Mar", pendapatan: 41_437_500 },
];

const ticketByEvent = [
  { event: "Java Jazz", terjual: 1240 },
  { event: "Tech Summit", terjual: 980 },
  { event: "Startup WE", terjual: 760 },
  { event: "Maraton", terjual: 640 },
  { event: "Kuliner", terjual: 510 },
  { event: "Workshop", terjual: 420 },
];

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc", "#e879f9", "#f0abfc"];

const recentTransactions = [
  { id: "TRX-091", customer: "Rina Kusuma", event: "Java Jazz Festival", tiket: "VIP", total: 750_000, status: "Berhasil" },
  { id: "TRX-090", customer: "Doni Setiawan", event: "Tech Summit 2026", tiket: "Regular", total: 350_000, status: "Berhasil" },
  { id: "TRX-089", customer: "Siti Aminah", event: "Startup Weekend", tiket: "Early Bird", total: 200_000, status: "Pending" },
  { id: "TRX-088", customer: "Budi Pranoto", event: "Java Jazz Festival", tiket: "Regular", total: 300_000, status: "Berhasil" },
  { id: "TRX-087", customer: "Lestari Indah", event: "Maraton Kota", tiket: "Regular", total: 150_000, status: "Gagal" },
];

const quickLinks = [
  { label: "Kelola Event", desc: "Buat, edit, & hapus event", href: "/event", gradient: "from-indigo-500 to-indigo-600" },
  { label: "Kelola Tiket", desc: "Atur kuota & harga tiket", href: "/ticket", gradient: "from-purple-500 to-purple-600" },
  { label: "Transaksi", desc: "Pantau semua pembayaran", href: "/transactions", gradient: "from-sky-500 to-sky-600" },
  { label: "Customers", desc: "Data & riwayat pembeli", href: "/customers", gradient: "from-emerald-500 to-emerald-600" },
  { label: "Laporan", desc: "Ekspor CSV & analitik", href: "/report", gradient: "from-amber-500 to-amber-600" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const statusStyle: Record<string, string> = {
  Berhasil: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Gagal: "bg-rose-100 text-rose-700",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Dashboard</h1>
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
          {[
            {
              title: "Event",
              href: "/event",
              icon: "🗓️",
              metrics: [{ label: "Aktif", value: "18" }, { label: "Draft", value: "4" }, { label: "Selesai", value: "2" }],
              accentBg: "bg-indigo-500",
            },
            {
              title: "Tiket",
              href: "/ticket",
              icon: "🎟️",
              metrics: [{ label: "Terjual", value: "4.820" }, { label: "Tersisa", value: "1.640" }, { label: "Event", value: "24" }],
              accentBg: "bg-purple-500",
            },
            {
              title: "Transaksi",
              href: "/transactions",
              icon: "📋",
              metrics: [{ label: "Berhasil", value: "1.210" }, { label: "Pending", value: "87" }, { label: "Gagal", value: "43" }],
              accentBg: "bg-sky-500",
            },
            {
              title: "Customers",
              href: "/customers",
              icon: "👥",
              metrics: [{ label: "Total", value: "3.105" }, { label: "Baru (bln)", value: "124" }, { label: "Aktif", value: "2.840" }],
              accentBg: "bg-emerald-500",
            },
            {
              title: "Laporan",
              href: "/report",
              icon: "📊",
              metrics: [{ label: "Pendapatan", value: "41,4jt" }, { label: "Pajak", value: "4,8jt" }, { label: "Fee", value: "2,4jt" }],
              accentBg: "bg-amber-500",
            },
          ].map((card) => (
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
