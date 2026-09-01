
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
  ComposedChart,
  Area,
} from "recharts";
import { getUserFromCookie } from "../utils/auth";
import { useLanguage } from "../i18n/LanguageContext";

const API_BASE = import.meta.env.VITE_API_BASE;

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc", "#e879f9"];

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
  event: { id: string; title: string };
  ticket: { id: string; type: DBTicketType; price: string };
  user: { id: string; full_name: string; email: string; birth_date: string | null } | null;
}

interface OrganizerEvent {
  id: string;
  title: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const ticketTypeLabelKey: Record<DBTicketType, string> = {
  FREE: "report.ticketFree",
  EARLY_BIRD: "report.ticketEarlyBird",
  REGULAR: "report.ticketRegular",
  VIP: "report.ticketVip",
  VVIP: "report.ticketVvip",
};

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
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<BookingAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizerEvents, setOrganizerEvents] = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [dbStats, setDbStats] = useState<{ detail_views: number; checkout_views: number; finalized_views: number } | null>(null);
  const [timeView, setTimeView] = useState<"year" | "month" | "day">("month");

  useEffect(() => {
    const user = getUserFromCookie() ?? {};
    const organizerId: string = user?.id ?? "";
    const url = organizerId
      ? `${API_BASE}/bookings?organizer_id=${organizerId}`
      : `${API_BASE}/bookings`;
    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setBookings(Array.isArray(data) ? data : (data.data ?? []));
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    if (organizerId) {
      fetch(`${API_BASE}/events?organizer_id=${organizerId}&limit=100`)
        .then((r) => r.json())
        .then((data) => {
          const events: OrganizerEvent[] = (data.data ?? []).map((e: any) => ({
            id: e.id,
            title: e.title,
          }));
          setOrganizerEvents(events);
          if (events.length > 0) setSelectedEventId(events[0].id);
        })
        .catch(console.error);
    }
  }, []);

  // Fetch funnel stats from DB whenever selected event changes
  useEffect(() => {
    if (!selectedEventId) return;
    setDbStats(null);
    fetch(`${API_BASE}/events/${selectedEventId}/stats`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setDbStats(res.data);
      })
      .catch(console.error);
  }, [selectedEventId]);

  const doneBookings = bookings.filter((b) => b.status === "DONE");

  // ─── Real demographics from birth_date ────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const ageGroupDefs = [
    { name: t("report.ageGroupUnder18"), min: 0,  max: 17  },
    { name: t("report.ageGroup18to24"), min: 18, max: 24  },
    { name: t("report.ageGroup25to34"), min: 25, max: 34  },
    { name: t("report.ageGroup35to44"), min: 35, max: 44  },
    { name: t("report.ageGroup45to54"), min: 45, max: 54  },
    { name: t("report.ageGroup55plus"),   min: 55, max: 999 },
  ];
  const demographicsData = (() => {
    const seenUsers = new Set<string>();
    const counts: Record<string, number> = {};
    bookings.forEach((b) => {
      if (!b.user?.id || seenUsers.has(b.user.id)) return;
      seenUsers.add(b.user.id);
      if (!b.user.birth_date) return;
      const age = currentYear - new Date(b.user.birth_date).getFullYear();
      const group = ageGroupDefs.find((g) => age >= g.min && age <= g.max);
      if (group) counts[group.name] = (counts[group.name] ?? 0) + 1;
    });
    const total = Object.values(counts).reduce((s, v) => s + v, 0);
    return ageGroupDefs
      .filter((g) => counts[g.name])
      .map((g) => ({ name: g.name, value: total > 0 ? Math.round((counts[g.name] / total) * 100) : 0 }));
  })();

  // ─── Time-series data (by year / month / day) ───────────────────────────
  const timeSeriesData = (() => {
    const map: Record<string, { revenue: number; tickets: number; bookings: number }> = {};

    const add = (key: string, b: BookingAPI) => {
      if (!map[key]) map[key] = { revenue: 0, tickets: 0, bookings: 0 };
      map[key].bookings += 1;
      if (b.status === "DONE") {
        map[key].revenue += Number(b.final_price ?? b.total_price ?? 0);
        map[key].tickets += b.quantity ?? 0;
      }
    };

    if (timeView === "year") {
      bookings.forEach((b) => {
        const key = new Date(b.createdAt).getFullYear().toString();
        add(key, b);
      });
      return Object.entries(map)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, v]) => ({ label, ...v }));
    }

    if (timeView === "month") {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 11);
      cutoff.setDate(1);
      bookings
        .filter((b) => new Date(b.createdAt) >= cutoff)
        .forEach((b) => {
          const d = new Date(b.createdAt);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          add(key, b);
        });
      return Object.entries(map)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, v]) => ({
          label: new Date(label + "-01").toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
          ...v,
        }));
    }

    // day — last 30 days
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (!map[key]) map[key] = { revenue: 0, tickets: 0, bookings: 0 };
    }
    bookings.forEach((b) => {
      const key = new Date(b.createdAt).toISOString().slice(0, 10);
      if (map[key]) add(key, b);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, v]) => ({
        label: new Date(label).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        ...v,
      }));
  })();

  const totalRevTS = timeSeriesData.reduce((s, d) => s + d.revenue, 0);
  const totalTixTS = timeSeriesData.reduce((s, d) => s + d.tickets, 0);
  const totalBkgTS = timeSeriesData.reduce((s, d) => s + d.bookings, 0);

  const TIME_VIEW_LABELS: Record<typeof timeView, string> = {
    year: t("report.timeViewLabelYear"),
    month: t("report.timeViewLabelMonth"),
    day: t("report.timeViewLabelDay"),
  };

  // ─── Real hourly trend from bookings.createdAt ────────────────────────────
  const hourlyTrend = (() => {
    const counts: Record<number, number> = {};
    bookings.forEach((b) => {
      const hour = new Date(b.createdAt).getHours();
      counts[hour] = (counts[hour] ?? 0) + 1;
    });
    return Array.from({ length: 24 }, (_, h) => ({
      jam: `${String(h).padStart(2, "0")}:00`,
      pembelian: counts[h] ?? 0,
    })).filter((d) => d.pembelian > 0);
  })();

  const salesData = doneBookings.map((b) => {
    const dbType = (b.ticket?.type ?? "REGULAR") as DBTicketType;
    return {
      id: b.display_id ?? b.id.slice(0, 8).toUpperCase(),
      event: b.event?.title ?? "–",
      dbTicketType: dbType,
      tiket: t(ticketTypeLabelKey[dbType]),
      qty: b.quantity ?? 0,
      total: Number(b.total_price ?? 0),
      tanggal: b.createdAt.slice(0, 10),
    };
  });

  const grossRevenue = doneBookings.reduce((s, b) => s + Number(b.total_price ?? 0), 0);
  const netRevenue   = doneBookings.reduce((s, b) => s + Number(b.final_price ?? 0), 0);
  const tax          = grossRevenue * 0.1;
  const platformFee  = grossRevenue * 0.05;

  const financialData = { grossRevenue, tax, platformFee, netRevenue };

  const financialBarData = [
    { name: t("report.cardGrossRevenue"), value: financialData.grossRevenue },
    { name: t("report.cardTax"), value: financialData.tax },
    { name: t("report.cardPlatformFee"), value: financialData.platformFee },
    { name: t("report.cardNetRevenue"), value: financialData.netRevenue },
  ];

  // ─── Real funnel data for selected event (from DB) ──────────────────────────
  const funnelStats = {
    detail: dbStats?.detail_views ?? 0,
    checkout: dbStats?.checkout_views ?? 0,
    done: dbStats?.finalized_views ?? 0,
  };

  const funnelData = [
    { name: t("report.funnelNameDetail"), value: funnelStats.detail, fill: "#6366f1" },
    { name: t("report.funnelNameCheckout"), value: funnelStats.checkout, fill: "#8b5cf6" },
    { name: t("report.funnelNameDone"), value: funnelStats.done, fill: "#a855f7" },
  ];

  const pctFmt = (num: number, den: number) =>
    den > 0 ? `${((num / den) * 100).toFixed(1)}%` : "–";

  const conversionRates = [
    { label: t("report.conversionDetailToCheckout"), pct: pctFmt(funnelStats.checkout, funnelStats.detail) },
    { label: t("report.conversionCheckoutToPay"), pct: pctFmt(funnelStats.done, funnelStats.checkout) },
    { label: t("report.conversionOverall"), pct: pctFmt(funnelStats.done, funnelStats.detail) },
    {
      label: t("report.dropoffTotal"),
      pct: funnelStats.detail > 0
        ? `${(((funnelStats.detail - funnelStats.done) / funnelStats.detail) * 100).toFixed(1)}%`
        : "–",
    },
  ];

  function exportToCSV() {
    const headers = [
      t("report.csvHeaderTransactionId"),
      t("report.csvHeaderEvent"),
      t("report.csvHeaderTicketType"),
      t("report.csvHeaderQty"),
      t("report.csvHeaderTotal"),
      t("report.csvHeaderDate"),
    ];
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{t("report.pageTitle")}</h1>
        <p className="text-gray-500 mt-1 text-sm">{t("report.pageSubtitle")}</p>
      </div>

      {/* ── INSIGHT ─────────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <SectionHeader
            title={t("report.sectionFunnelTitle")}
            subtitle={t("report.sectionFunnelSubtitle")}
          />
          {/* Event selector */}
          <div className="flex-shrink-0">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {t("report.selectEventLabel")}
            </label>
            {organizerEvents.length === 0 ? (
              <p className="text-xs text-gray-400 italic">{t("report.noEventsYet")}</p>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[200px] max-w-xs"
              >
                {organizerEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label={t("report.statDetailViews")} value={funnelStats.detail.toLocaleString("id-ID")} color="bg-indigo-50 text-indigo-800" />
          <StatCard label={t("report.statCheckoutViews")} value={funnelStats.checkout.toLocaleString("id-ID")} color="bg-purple-50 text-purple-800" />
          <StatCard label={t("report.statPaymentDone")} value={funnelStats.done.toLocaleString("id-ID")} color="bg-fuchsia-50 text-fuchsia-800" />
        </div>

        {/* Conversion rates */}
        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
          {conversionRates.map((item) => (
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
                formatter={(val) => [t("report.funnelTooltipVisitors", { count: Number(val).toLocaleString("id-ID") })]}
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

      {/* ── STATISTIK PENJUALAN BERDASARKAN WAKTU ──────────────────────────── */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <SectionHeader
            title={t("report.sectionTimeStatsTitle")}
            subtitle={t("report.sectionTimeStatsSubtitle")}
          />
          {/* Granularity toggle */}
          <div className="flex gap-2 flex-shrink-0">
            {(["year", "month", "day"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setTimeView(v)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  timeView === v
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {v === "year" ? t("report.timeViewYear") : v === "month" ? t("report.timeViewMonth") : t("report.timeViewDay")}
              </button>
            ))}
          </div>
        </div>

        {/* Period label */}
        <p className="text-xs text-gray-400 mb-4 -mt-2">{TIME_VIEW_LABELS[timeView]}</p>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl p-5 bg-indigo-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 opacity-80">{t("report.summaryNetRevenue")}</p>
            <p className="text-xl font-bold text-indigo-800 mt-1">{formatRupiah(totalRevTS)}</p>
          </div>
          <div className="rounded-2xl p-5 bg-purple-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-500 opacity-80">{t("report.summaryTicketsSold")}</p>
            <p className="text-xl font-bold text-purple-800 mt-1">{totalTixTS.toLocaleString("id-ID")}</p>
          </div>
          <div className="rounded-2xl p-5 bg-sky-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-500 opacity-80">{t("report.summaryTotalTransactions")}</p>
            <p className="text-xl font-bold text-sky-800 mt-1">{totalBkgTS.toLocaleString("id-ID")}</p>
          </div>
        </div>

        {/* Revenue bar + tickets line */}
        {loading ? (
          <div className="h-80 flex items-center justify-center text-gray-400 text-sm">{t("report.loadingData")}</div>
        ) : timeSeriesData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-400 text-sm">{t("report.noDataForPeriod")}</div>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">{t("report.chartRevenueTicketsTitle")}</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timeSeriesData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    interval={timeView === "day" ? Math.floor(timeSeriesData.length / 8) : 0}
                  />
                  <YAxis
                    yAxisId="rev"
                    orientation="left"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v) =>
                      v >= 1_000_000
                        ? `${(v / 1_000_000).toFixed(0)}jt`
                        : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}rb`
                        : `${v}`
                    }
                  />
                  <YAxis
                    yAxisId="tix"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                    formatter={(val, name) => {
                      if (name === "revenue") return [formatRupiah(Number(val)), t("report.legendNetRevenue")];
                      if (name === "tickets") return [t("report.ticketsUnitLabel", { count: Number(val).toLocaleString("id-ID") }), t("report.legendTicketsSold")];
                      return [val, name];
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => (
                      <span className="text-xs text-gray-600">
                        {value === "revenue" ? t("report.legendNetRevenue") : t("report.legendTicketsSold")}
                      </span>
                    )}
                  />
                  <Area
                    yAxisId="rev"
                    type="monotone"
                    dataKey="revenue"
                    fill="#e0e7ff"
                    stroke="#6366f1"
                    strokeWidth={2}
                  />
                  <Bar
                    yAxisId="tix"
                    dataKey="tickets"
                    fill="#a855f7"
                    radius={[6, 6, 0, 0]}
                    opacity={0.7}
                    barSize={timeView === "year" ? 40 : timeView === "month" ? 22 : 8}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Bookings count bar chart */}
            <h3 className="text-sm font-semibold text-gray-600 mb-3 mt-8 uppercase tracking-wide">{t("report.chartTransactionCountTitle")}</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeriesData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    interval={timeView === "day" ? Math.floor(timeSeriesData.length / 8) : 0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                    formatter={(val) => [t("report.transactionsUnitLabel", { count: Number(val).toLocaleString("id-ID") }), t("report.legendTransactions")]}
                  />
                  <Bar dataKey="bookings" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={timeView === "year" ? 40 : timeView === "month" ? 22 : 8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>

      {/* ── LAPORAN PENJUALAN ────────────────────────────────────────────────── */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <SectionHeader
            title={t("report.sectionSalesReportTitle")}
            subtitle={t("report.sectionSalesReportSubtitle")}
          />
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
              </svg>
              {t("report.exportCsvButton")}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-semibold">{t("report.columnTransactionId")}</th>
                <th className="px-5 py-3 text-left font-semibold">{t("report.columnEvent")}</th>
                <th className="px-5 py-3 text-left font-semibold">{t("report.columnTicketType")}</th>
                <th className="px-5 py-3 text-right font-semibold">{t("report.columnQty")}</th>
                <th className="px-5 py-3 text-right font-semibold">{t("report.columnTotal")}</th>
                <th className="px-5 py-3 text-left font-semibold">{t("report.columnDate")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-gray-400">{t("report.loadingData")}</td>
                </tr>
              ) : salesData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-gray-400">{t("report.noTransactionsYet")}</td>
                </tr>
              ) : (
                <>
                  {salesData.map((row) => (
                    <tr key={row.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-indigo-600 font-medium">{row.id}</td>
                      <td className="px-5 py-3.5 text-gray-700">{row.event}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          row.dbTicketType === "VIP" || row.dbTicketType === "VVIP" ? "bg-amber-100 text-amber-700" :
                          row.dbTicketType === "REGULAR" ? "bg-sky-100 text-sky-700" :
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
          title={t("report.sectionBuyerAnalyticsTitle")}
          subtitle={t("report.sectionBuyerAnalyticsSubtitle")}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie – demographics */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">{t("report.chartAgeDemographicsTitle")}</h3>
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
            <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">{t("report.chartHourlyTrendTitle")}</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="jam" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                    formatter={(val) => [t("report.purchaseUnitLabel", { count: String(val) })]}
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
          title={t("report.sectionFinancialReportTitle")}
          subtitle={t("report.sectionFinancialReportSubtitle")}
        />

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{t("report.cardGrossRevenue")}</p>
            <p className="text-xl font-bold mt-1">{formatRupiah(financialData.grossRevenue)}</p>
          </div>
          <div className="rounded-2xl p-5 bg-gradient-to-br from-rose-500 to-rose-600 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{t("report.cardTax")}</p>
            <p className="text-xl font-bold mt-1">{formatRupiah(financialData.tax)}</p>
          </div>
          <div className="rounded-2xl p-5 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{t("report.cardPlatformFee")}</p>
            <p className="text-xl font-bold mt-1">{formatRupiah(financialData.platformFee)}</p>
          </div>
          <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{t("report.cardNetRevenue")}</p>
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
                <th className="px-5 py-3 text-left font-semibold">{t("report.breakdownColumnComponent")}</th>
                <th className="px-5 py-3 text-right font-semibold">{t("report.breakdownColumnAmount")}</th>
                <th className="px-5 py-3 text-right font-semibold">{t("report.breakdownColumnPercentage")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { label: t("report.breakdownGrossRevenue"), amount: financialData.grossRevenue, pct: "100%", color: "text-indigo-600" },
                { label: t("report.breakdownTax"), amount: -financialData.tax, pct: "-10%", color: "text-rose-600" },
                { label: t("report.breakdownPlatformFee"), amount: -financialData.platformFee, pct: "-5%", color: "text-amber-600" },
                { label: t("report.breakdownNetRevenue"), amount: financialData.netRevenue, pct: "85%", color: "text-emerald-600" },
              ].map((row) => (
                <tr key={row.label} className={`hover:bg-gray-50/60 transition-colors ${row.label === t("report.breakdownNetRevenue") ? "font-bold bg-emerald-50/40" : ""}`}>
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
