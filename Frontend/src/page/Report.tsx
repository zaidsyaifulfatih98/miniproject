
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const funnelData = [
  { name: "Halaman Detail Tiket", value: 8420, fill: "#6366f1" },
  { name: "Halaman Checkout", value: 4350, fill: "#8b5cf6" },
  { name: "Pembayaran Selesai", value: 2180, fill: "#a855f7" },
];


const API_BASE_KEY_DOT = import.meta.env.VITE_API_BASE_KEY
const API_BASE = `${API_BASE_KEY_DOT}/api`;


const PIE_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc", "#e879f9", "#f0abfc"];

// ─── Types ────────────────────────────────────────────────────────────────────

type DBTicketType = "FREE" | "EARLY_BIRD" | "REGULAR" | "VIP" | "VVIP";

interface BookingAPI {
  id: string;
  display_id: string | null;
  quantity: number | null;
  status: string;
  total_price: string | null;
  final_price: string | null;
  createdAt: string;
  user: { id: string; full_name: string; email: string; birth_date: string | null };
  event: { id: string; title: string };
  ticket: { id: string; type: DBTicketType; price: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function mapTicketType(t: DBTicketType): string {
  const map: Record<DBTicketType, string> = {
    FREE: "Free",
    EARLY_BIRD: "Early Bird",
    REGULAR: "Regular",
    VIP: "VIP",
    VVIP: "VVIP",
  };
  return map[t] ?? t;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-2xl p-5 ${color} flex flex-col gap-1`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Report() {
  const [bookings, setBookings] = useState<BookingAPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") ?? "{}");
    const organizerId: string = user?.id ?? "";
    const url = organizerId
      ? `${API_BASE}/bookings?organizer_id=${organizerId}`
      : `${API_BASE}/api/bookings`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setBookings(Array.isArray(data) ? data : (data.data ?? []));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const doneBookings = bookings.filter((b) => b.status === "DONE");

  // Tren waktu pembelian per jam (X = jam, Y = total bookings DONE)
  const hourlyMap: Record<number, number> = {};
  doneBookings.forEach((b) => {
    const hour = new Date(b.createdAt).getHours();
    hourlyMap[hour] = (hourlyMap[hour] ?? 0) + 1;
  });
  const hourlyTrend = Array.from({ length: 24 }, (_, h) => ({
    jam: `${String(h).padStart(2, "0")}:00`,
    pembelian: hourlyMap[h] ?? 0,
  }));

  const salesData = doneBookings.map((b) => ({
    id: b.display_id ?? b.id.slice(0, 8).toUpperCase(),
    event: b.event?.title ?? "–",
    tiket: mapTicketType((b.ticket?.type ?? "REGULAR") as DBTicketType),
    qty: b.quantity ?? 0,
    total: Number(b.total_price ?? 0),
    tanggal: b.createdAt.slice(0, 10),
  }));

  // Demografi usia pembeli dari birth_date user (scope: semua booking organizer)
  const AGE_GROUPS = [
    { name: "< 18 tahun",  min: 0,  max: 17 },
    { name: "18–24 tahun", min: 18, max: 24 },
    { name: "25–34 tahun", min: 25, max: 34 },
    { name: "35–44 tahun", min: 35, max: 44 },
    { name: "45–54 tahun", min: 45, max: 54 },
    { name: "55+ tahun",   min: 55, max: Infinity },
  ];
  const uniqueBuyers = Array.from(
    new Map(bookings.filter((b) => b.user?.birth_date).map((b) => [b.user.id, b.user])).values()
  );
  const now = new Date();
  const demographicsData = (() => {
    const counts: Record<string, number> = {};
    AGE_GROUPS.forEach((g) => { counts[g.name] = 0; });
    uniqueBuyers.forEach(({ birth_date }) => {
      if (!birth_date) return;
      const born = new Date(birth_date);
      let age = now.getFullYear() - born.getFullYear();
      const hasBirthdayPassed =
        now.getMonth() > born.getMonth() ||
        (now.getMonth() === born.getMonth() && now.getDate() >= born.getDate());
      if (!hasBirthdayPassed) age -= 1;
      const group = AGE_GROUPS.find((g) => age >= g.min && age <= g.max);
      if (group) counts[group.name] += 1;
    });
    const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
    return AGE_GROUPS.map((g) => ({
      name: g.name,
      value: Math.round((counts[g.name] / total) * 100),
    })).filter((g) => g.value > 0);
  })();

  const grossRevenue = doneBookings.reduce((s, b) => s + Number(b.total_price ?? 0), 0);
  const netRevenue   = doneBookings.reduce((s, b) => s + Number(b.final_price ?? 0), 0);
  const tax          = grossRevenue * 0.1;
  const platformFee  = grossRevenue * 0.05;

  const financialData = { grossRevenue, tax, platformFee, netRevenue };

  const financialBarData = [
    { name: "Pendapatan Kotor", value: financialData.grossRevenue },
    { name: "Pajak (10%)", value: financialData.tax },
    { name: "Fee Platform (5%)", value: financialData.platformFee },
    { name: "Pendapatan Bersih", value: financialData.netRevenue },
  ];

  function exportToCSV() {
    const headers = ["ID Transaksi", "Event", "Jenis Tiket", "Qty", "Total (Rp)", "Tanggal"];
    const rows = salesData.map((r) => [r.id, r.event, r.tiket, r.qty, r.total, r.tanggal]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "laporan_penjualan.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Dashboard Laporan</h1>
        <p className="text-gray-500 mt-1 text-sm">Rekap performa, analitik, dan keuangan event Anda</p>
      </div>

      {/* ── INSIGHT ─────────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <SectionHeader
          title="Insight — Funnel Pengunjung"
          subtitle="Tracking halaman: Detail Tiket → Checkout → Pembayaran Selesai"
        />

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Detail Tiket Dilihat" value="8.420" color="bg-indigo-50 text-indigo-800" />
          <StatCard label="Masuk Checkout" value="4.350" color="bg-purple-50 text-purple-800" />
          <StatCard label="Pembayaran Selesai" value="2.180" color="bg-fuchsia-50 text-fuchsia-800" />
        </div>

        {/* Conversion rates */}
        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
          {[
            { label: "Konversi Detail → Checkout", pct: "51.7%" },
            { label: "Konversi Checkout → Bayar", pct: "50.1%" },
            { label: "Konversi Overall", pct: "25.9%" },
            { label: "Drop-off Total", pct: "74.1%" },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{item.pct}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Funnel chart */}
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip
                formatter={(val) => [`${Number(val).toLocaleString("id-ID")} pengunjung`]}
              />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                {funnelData.map((entry, index) => (
                  <Cell key={`funnel-${index}`} fill={entry.fill} />
                ))}
                <LabelList position="center" fill="#fff" stroke="none" dataKey="name" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── LAPORAN PENJUALAN ────────────────────────────────────────────────── */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <SectionHeader
            title="Laporan Penjualan"
            subtitle="Riwayat transaksi tiket seluruh event"
          />
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
              </svg>
              Ekspor CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-semibold">ID Transaksi</th>
                <th className="px-5 py-3 text-left font-semibold">Event</th>
                <th className="px-5 py-3 text-left font-semibold">Jenis Tiket</th>
                <th className="px-5 py-3 text-right font-semibold">Qty</th>
                <th className="px-5 py-3 text-right font-semibold">Total</th>
                <th className="px-5 py-3 text-left font-semibold">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-gray-400">Memuat data…</td>
                </tr>
              ) : salesData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-gray-400">Belum ada transaksi.</td>
                </tr>
              ) : (
                <>
                  {salesData.map((row) => (
                    <tr key={row.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-indigo-600 font-medium">{row.id}</td>
                      <td className="px-5 py-3.5 text-gray-700">{row.event}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          row.tiket === "VIP" ? "bg-amber-100 text-amber-700" :
                          row.tiket === "Regular" ? "bg-sky-100 text-sky-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>{row.tiket}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-700">{row.qty}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-800">{formatRupiah(row.total)}</td>
                      <td className="px-5 py-3.5 text-gray-500">{row.tanggal}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── ANALITIK PEMBELI ─────────────────────────────────────────────────── */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <SectionHeader
          title="Analitik Pembeli"
          subtitle="Demografi pembeli dan tren waktu pembelian teramai"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie – demographics */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Demografi Usia Pembeli</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demographicsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {demographicsData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`${val}%`]} />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line – hourly trend */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Tren Waktu Pembelian (per Jam)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="jam" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                    formatter={(val) => [`${val} pembelian`]}
                  />
                  <Line
                    type="monotone"
                    dataKey="pembelian"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#6366f1" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ── LAPORAN KEUANGAN ─────────────────────────────────────────────────── */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <SectionHeader
          title="Laporan Keuangan"
          subtitle="Rekapitulasi pajak, fee platform, dan pendapatan bersih"
        />

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Pendapatan Kotor</p>
            <p className="text-xl font-bold mt-1">{formatRupiah(financialData.grossRevenue)}</p>
          </div>
          <div className="rounded-2xl p-5 bg-gradient-to-br from-rose-500 to-rose-600 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Pajak (10%)</p>
            <p className="text-xl font-bold mt-1">{formatRupiah(financialData.tax)}</p>
          </div>
          <div className="rounded-2xl p-5 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Fee Platform (5%)</p>
            <p className="text-xl font-bold mt-1">{formatRupiah(financialData.platformFee)}</p>
          </div>
          <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Pendapatan Bersih</p>
            <p className="text-xl font-bold mt-1">{formatRupiah(financialData.netRevenue)}</p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialBarData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`}
              />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                formatter={(val) => [formatRupiah(Number(val))]}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {financialBarData.map((_entry, index) => {
                  const colors = ["#6366f1", "#f43f5e", "#f59e0b", "#10b981"];
                  return <Cell key={`bar-${index}`} fill={colors[index % colors.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown table */}
        <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-100">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-semibold">Komponen</th>
                <th className="px-5 py-3 text-right font-semibold">Jumlah (Rp)</th>
                <th className="px-5 py-3 text-right font-semibold">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { label: "Pendapatan Kotor", amount: financialData.grossRevenue, pct: "100%", color: "text-indigo-600" },
                { label: "Pajak (PPh/PPN)", amount: -financialData.tax, pct: "-10%", color: "text-rose-600" },
                { label: "Fee Platform", amount: -financialData.platformFee, pct: "-5%", color: "text-amber-600" },
                { label: "Pendapatan Bersih", amount: financialData.netRevenue, pct: "85%", color: "text-emerald-600" },
              ].map((row) => (
                <tr key={row.label} className={`hover:bg-gray-50/60 transition-colors ${row.label === "Pendapatan Bersih" ? "font-bold bg-emerald-50/40" : ""}`}>
                  <td className="px-5 py-3.5 text-gray-700">{row.label}</td>
                  <td className={`px-5 py-3.5 text-right font-semibold ${row.color}`}>{formatRupiah(Math.abs(row.amount))}</td>
                  <td className={`px-5 py-3.5 text-right font-semibold ${row.color}`}>{row.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
