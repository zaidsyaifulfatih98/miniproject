
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000/api";

// ── DB enums ─────────────────────────────────────────────────────────────────
type DBStatus =
  | "PENDING"
  | "WAITING_FOR_PAYMENTS"
  | "WAITING_FOR_CONFIRMATION"
  | "REJECTED"
  | "DONE"
  | "CANCELLED"
  | "EXPIRED";

type DBTicketType = "FREE" | "EARLY_BIRD" | "REGULAR" | "VIP" | "VVIP";

// ── UI display types ──────────────────────────────────────────────────────────
type TxStatus = "Berhasil" | "Menunggu" | "Expired" | "Gagal";
type TicketType = "Free" | "Early Bird" | "Reguler" | "VIP" | "VVIP";

// ── API shape ─────────────────────────────────────────────────────────────────
interface BookingAPI {
  id: string;
  display_id: string | null;
  event_id: string;
  quantity: number | null;
  status: DBStatus;
  total_price: string | null;
  discount_amount: string | null;
  points_used: number | null;
  final_price: string | null;
  createdAt: string;
  user: { id: string; full_name: string; email: string };
  event: { id: string; title: string };
  ticket: { id: string; type: DBTicketType; price: string };
  promotion: { id: string; name: string; discount_amount: string } | null;
}

// ── Mappings ──────────────────────────────────────────────────────────────────
function mapStatus(s: DBStatus): TxStatus {
  if (s === "DONE") return "Berhasil";
  if (s === "EXPIRED") return "Expired";
  if (s === "PENDING" || s === "WAITING_FOR_PAYMENTS" || s === "WAITING_FOR_CONFIRMATION") return "Menunggu";
  return "Gagal";
}

function mapTicketType(t: DBTicketType): TicketType {
  const map: Record<DBTicketType, TicketType> = {
    FREE: "Free",
    EARLY_BIRD: "Early Bird",
    REGULAR: "Reguler",
    VIP: "VIP",
    VVIP: "VVIP",
  };
  return map[t];
}

const ticketTypeBadge: Record<TicketType, string> = {
  Free:         "bg-gray-100 text-gray-600",
  "Early Bird": "bg-green-100 text-green-700",
  Reguler:      "bg-blue-100 text-blue-700",
  VIP:          "bg-purple-100 text-purple-700",
  VVIP:         "bg-yellow-100 text-yellow-700",
};

const statusColor: Record<TxStatus, string> = {
  Berhasil: "bg-green-100 text-green-700",
  Menunggu: "bg-yellow-100 text-yellow-700",
  Expired:  "bg-gray-100 text-gray-500",
  Gagal:    "bg-red-100 text-red-600",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function Transactions() {
  const navigate = useNavigate();
  const [bookings, setBookings]       = useState<BookingAPI[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<"transaksi" | "statistik">("transaksi");
  const [filterEvent, setFilterEvent] = useState<string | "Semua">("Semua");
  const [filterStatus, setFilterStatus] = useState<TxStatus | "Semua">("Semua");
  const [search, setSearch]           = useState("");

  // ── Fetch bookings ──────────────────────────────────────────────────────────
  const fetchBookings = useCallback(() => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem("user") ?? "{}");
    const organizerId: string = user?.id ?? "";
    const url = organizerId ? `${API_BASE}/bookings?organizer_id=${organizerId}` : `${API_BASE}/bookings`;
    fetch(url)
      .then((r) => r.json())
      .then((res) => { if (res.success) setBookings(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ── Unique events derived from bookings ────────────────────────────────────
  const eventList = Array.from(
    new Map(bookings.map((b) => [b.event_id, b.event])).values()
  );

  // ── Scoped bookings (by event filter) ─────────────────────────────────────
  const scopedBookings = filterEvent === "Semua"
    ? bookings
    : bookings.filter((b) => b.event_id === filterEvent);

  // ── Filtered transactions (transaksi tab) ─────────────────────────────────
  const filteredTx = scopedBookings.filter((b) => {
    const uiStatus = mapStatus(b.status);
    const matchStatus = filterStatus === "Semua" || uiStatus === filterStatus;
    const matchSearch =
      (b.user?.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (b.display_id ?? b.id).toLowerCase().includes(search.toLowerCase()) ||
      (b.user?.email ?? "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // ── Summary counts ─────────────────────────────────────────────────────────
  const successTx  = scopedBookings.filter((b) => b.status === "DONE");
  const pendingTx  = scopedBookings.filter((b) =>
    b.status === "PENDING" || b.status === "WAITING_FOR_PAYMENTS" || b.status === "WAITING_FOR_CONFIRMATION"
  );
  const expiredTx  = scopedBookings.filter((b) => b.status === "EXPIRED");
  const failedTx   = scopedBookings.filter((b) => b.status === "REJECTED" || b.status === "CANCELLED");
  const txRevenue  = successTx.reduce((s, b) => s + Number(b.final_price ?? 0), 0);

  // ── Statistics derived from bookings ──────────────────────────────────────
  const totalSold    = successTx.reduce((s, b) => s + (b.quantity ?? 0), 0);
  const totalRevenue = txRevenue;
  const withPromo    = scopedBookings.filter((b) => b.promotion !== null && b.promotion !== undefined);

  // Per-event stats
  const byEvent = eventList
    .filter((ev) => filterEvent === "Semua" || ev.id === filterEvent)
    .map((ev) => {
      const evBookings = scopedBookings.filter((b) => b.event_id === ev.id && b.status === "DONE");
      const evSold    = evBookings.reduce((s, b) => s + (b.quantity ?? 0), 0);
      const evRevenue = evBookings.reduce((s, b) => s + Number(b.final_price ?? 0), 0);
      const evPromos  = scopedBookings.filter((b) => b.event_id === ev.id && b.promotion).length;
      return { ev, evSold, evRevenue, evPromos };
    })
    .filter((x) => x.evSold > 0 || x.evRevenue > 0);

  // Per-type stats
  const allTicketTypes: DBTicketType[] = ["FREE", "EARLY_BIRD", "REGULAR", "VIP", "VVIP"];
  const byType = allTicketTypes.map((dbType) => {
    const typeBookings = scopedBookings.filter((b) => b.ticket?.type === dbType && b.status === "DONE");
    const sold    = typeBookings.reduce((s, b) => s + (b.quantity ?? 0), 0);
    const revenue = typeBookings.reduce((s, b) => s + Number(b.final_price ?? 0), 0);
    return { type: mapTicketType(dbType), sold, revenue };
  }).filter((x) => x.sold > 0);

  const maxRevenue = Math.max(...byEvent.map((x) => x.evRevenue), 1);
  const maxSold    = Math.max(...byEvent.map((x) => x.evSold), 1);
  const totalTx    = scopedBookings.length;
  const successRate = totalTx ? Math.round((successTx.length / totalTx) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Penjualan & Transaksi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Rekap transaksi dan statistik performa penjualan tiket</p>
        </div>
      </div>

      {/* Tabs + Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(["transaksi", "statistik"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "transaksi" ? "Daftar Transaksi" : "Statistik"}
            </button>
          ))}
        </div>
        <select
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value === "Semua" ? "Semua" : e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="Semua">Semua Event</option>
          {eventList.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
      </div>

      {/* ── TAB: Transaksi ── */}
      {tab === "transaksi" && (
        <div className="space-y-4">
          {/* Summary mini-cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Total Pendapatan", value: `Rp ${(txRevenue / 1_000_000).toFixed(1)}jt`, color: "text-green-600", bg: "bg-green-50" },
              { label: "Berhasil",  value: successTx.length,  color: "text-green-600",  bg: "bg-green-50" },
              { label: "Menunggu",  value: pendingTx.length,  color: "text-yellow-600", bg: "bg-yellow-50" },
              { label: "Expired",   value: expiredTx.length,  color: "text-gray-500",   bg: "bg-gray-100" },
              { label: "Gagal",     value: failedTx.length,   color: "text-red-500",    bg: "bg-red-50" },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center flex-none`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${c.color.replace("text-", "bg-")}`} />
                </div>
                <div>
                  <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
                  <p className="text-xs text-gray-500">{c.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari ID, nama, atau email..."
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TxStatus | "Semua")}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="Semua">Semua Status</option>
              <option value="Berhasil">Berhasil</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Expired">Expired</option>
              <option value="Gagal">Gagal</option>
            </select>
            <span className="text-xs text-gray-400 ml-auto">{filteredTx.length} transaksi</span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID Transaksi</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pembeli</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiket</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Setelah Diskon</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Promo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={11} className="text-center py-12 text-gray-400 text-sm">Memuat data...</td></tr>
                ) : filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-gray-400 text-sm">Tidak ada transaksi ditemukan.</td>
                  </tr>
                ) : (
                  <>
                  {filteredTx.map((b) => {
                  const uiStatus     = mapStatus(b.status);
                  const uiTicketType = mapTicketType(b.ticket?.type ?? "REGULAR");
                  const totalPrice   = Number(b.total_price ?? 0);
                  const finalPrice   = Number(b.final_price ?? 0);
                  const hasDiscount  = !!b.promotion || (b.points_used ?? 0) > 0;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-gray-500">{b.display_id ?? b.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">{b.user?.full_name ?? "-"}</p>
                        <p className="text-xs text-gray-400">{b.user?.email ?? "-"}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600 text-xs max-w-[140px] truncate">{b.event?.title ?? "-"}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticketTypeBadge[uiTicketType]}`}>
                          {uiTicketType}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{b.quantity ?? 0}</td>
                      <td className="px-5 py-4 font-semibold text-gray-700">Rp {totalPrice.toLocaleString("id-ID")}</td>
                      <td className="px-5 py-4">
                        {hasDiscount
                          ? <span className="font-semibold text-green-700">Rp {finalPrice.toLocaleString("id-ID")}</span>
                          : <span className="font-semibold text-gray-700">Rp {totalPrice.toLocaleString("id-ID")}</span>
                        }
                      </td>
                      <td className="px-5 py-4">
                        {b.promotion
                          ? <span className="font-mono text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded tracking-widest">{b.promotion.name}</span>
                          : <span className="text-gray-300 text-xs">—</span>
                        }
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(b.createdAt)}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[uiStatus]}`}>
                          {uiStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {(b.status === "WAITING_FOR_PAYMENTS" || b.status === "WAITING_FOR_CONFIRMATION") && (
                          <button
                            onClick={() => navigate(`/payment/${b.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs font-semibold transition"
                          >
                            <span>Lihat Status</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                        {b.status === "DONE" && (
                          <span className="text-xs text-gray-500 font-medium">Selesai</span>
                        )}
                        {b.status === "EXPIRED" && (
                          <span className="text-xs text-gray-400 font-medium">Kadaluarsa</span>
                        )}
                        {(b.status === "REJECTED" || b.status === "CANCELLED") && (
                          <span className="text-xs text-red-500 font-medium">Ditolak</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                  </>
                )}
              </tbody>
            </table>            </div>          </div>
        </div>
      )}

      {/* ── TAB: Statistik ── */}
      {tab === "statistik" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Tiket Terjual",
                value: totalSold.toLocaleString("id-ID"),
                sub: `dari transaksi berhasil`,
                color: "text-orange-500",
                bg: "bg-orange-50",
                icon: (
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                ),
              },
              {
                label: "Total Pendapatan",
                value: `Rp ${(totalRevenue / 1_000_000).toFixed(1)}jt`,
                sub: `dari ${successTx.length} booking selesai`,
                color: "text-green-600",
                bg: "bg-green-50",
                icon: (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                label: "Tingkat Keberhasilan",
                value: `${successRate}%`,
                sub: `${successTx.length} dari ${totalTx} transaksi`,
                color: "text-blue-600",
                bg: "bg-blue-50",
                icon: (
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
              },
              {
                label: "Pakai Promo",
                value: withPromo.length.toLocaleString("id-ID"),
                sub: "booking dengan kode promo",
                color: "text-purple-600",
                bg: "bg-purple-50",
                icon: (
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                ),
              },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                  {card.icon}
                </div>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs font-medium text-gray-600 mt-1">{card.label}</p>
                <p className="text-xs text-gray-400">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          {byEvent.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Pendapatan per Event</h3>
                <div className="space-y-3">
                  {byEvent.map(({ ev, evRevenue }) => {
                    const barPct = Math.round((evRevenue / maxRevenue) * 100);
                    return (
                      <div key={ev.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 truncate max-w-[55%]">{ev.title}</span>
                          <span className="text-xs font-semibold text-gray-700">Rp {(evRevenue / 1_000_000).toFixed(1)}jt</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400 rounded-full transition-all duration-500" style={{ width: `${barPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Tiket Terjual per Event</h3>
                <div className="space-y-3">
                  {byEvent.map(({ ev, evSold }) => {
                    const barPct = Math.round((evSold / maxSold) * 100);
                    return (
                      <div key={ev.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 truncate max-w-[55%]">{ev.title}</span>
                          <span className="text-xs font-semibold text-gray-700">{evSold} tiket</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${barPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Per-Event Breakdown Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Performa per Event</h3>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiket Terjual</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Perbandingan</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pendapatan</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Promo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byEvent.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Tidak ada data untuk ditampilkan.</td></tr>
                ) : byEvent.map(({ ev, evSold, evRevenue, evPromos }) => (
                    <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-800">{ev.title}</td>
                      <td className="px-5 py-4 text-gray-600">{evSold} tiket</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(Math.round((evSold / maxSold) * 100), 100)}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-600">{evSold}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-700 font-medium">Rp {evRevenue.toLocaleString("id-ID")}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${evPromos > 0 ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"}`}>
                          {evPromos} promo
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>            </div>          </div>

          {/* Per-Type Breakdown Cards */}
          {byType.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Performa per Tipe Tiket</h3>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {byType.map(({ type, sold, revenue }) => (
                    <div key={type} className="border border-gray-100 rounded-lg p-4 space-y-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticketTypeBadge[type]}`}>
                        {type}
                      </span>
                      <div>
                        <p className="text-lg font-bold text-gray-800">{sold}</p>
                        <p className="text-xs text-gray-400 mt-0.5">tiket terjual</p>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">Rp {revenue.toLocaleString("id-ID")}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
