
import { useState } from "react";
import { useEventStore } from "../store/eventStore";

type TicketType = "Early Bird" | "Reguler" | "VIP" | "VVIP";
const TICKET_TYPES: TicketType[] = ["Early Bird", "Reguler", "VIP", "VVIP"];

const ticketTypeBadge: Record<TicketType, string> = {
  "Early Bird": "bg-green-100 text-green-700",
  Reguler: "bg-blue-100 text-blue-700",
  VIP: "bg-purple-100 text-purple-700",
  VVIP: "bg-yellow-100 text-yellow-700",
};

interface TicketPool {
  eventId: number;
  type: TicketType;
  price: number;
  quota: number;
  sold: number;
}

interface PromoPool {
  eventId: number;
  discount: number;
  maxUse: number;
  used: number;
  expiry: string;
}

type TxStatus = "Berhasil" | "Menunggu" | "Gagal";

interface Transaction {
  id: string;
  eventId: number;
  buyer: string;
  email: string;
  ticketType: TicketType;
  qty: number;
  amount: number;
  status: TxStatus;
  date: string;
  promoCode?: string;
}

const ticketPools: TicketPool[] = [
  { eventId: 1, type: "Early Bird", price: 150000, quota: 200, sold: 180 },
  { eventId: 1, type: "Reguler",    price: 250000, quota: 500, sold: 120 },
  { eventId: 1, type: "VIP",        price: 500000, quota: 100, sold: 60  },
  { eventId: 2, type: "Reguler",    price: 100000, quota: 150, sold: 90  },
  { eventId: 2, type: "VIP",        price: 200000, quota: 50,  sold: 30  },
  { eventId: 3, type: "VVIP",       price: 750000, quota: 20,  sold: 20  },
];

const promoPools: PromoPool[] = [
  { eventId: 1, discount: 20, maxUse: 100, used: 45, expiry: "2026-04-10" },
  { eventId: 2, discount: 15, maxUse: 50,  used: 12, expiry: "2026-05-01" },
];

const initialTransactions: Transaction[] = [
  { id: "TRX-2026-001", eventId: 1, buyer: "Andi Prasetyo",  email: "andi@email.com",  ticketType: "VIP",        qty: 2, amount: 1000000, status: "Berhasil", date: "2026-03-10", promoCode: "KONSER20" },
  { id: "TRX-2026-002", eventId: 1, buyer: "Sari Dewi",      email: "sari@email.com",  ticketType: "Reguler",    qty: 1, amount: 250000,  status: "Berhasil", date: "2026-03-12" },
  { id: "TRX-2026-003", eventId: 2, buyer: "Budi Santoso",   email: "budi@email.com",  ticketType: "VIP",        qty: 1, amount: 200000,  status: "Menunggu", date: "2026-03-20", promoCode: "WORKSHOP15" },
  { id: "TRX-2026-004", eventId: 3, buyer: "Rina Kusuma",    email: "rina@email.com",  ticketType: "VVIP",       qty: 1, amount: 750000,  status: "Berhasil", date: "2026-02-18" },
  { id: "TRX-2026-005", eventId: 1, buyer: "Dimas Rahmat",   email: "dimas@email.com", ticketType: "Early Bird", qty: 3, amount: 450000,  status: "Berhasil", date: "2026-03-01" },
  { id: "TRX-2026-006", eventId: 2, buyer: "Maya Putri",     email: "maya@email.com",  ticketType: "Reguler",    qty: 2, amount: 200000,  status: "Gagal",    date: "2026-03-22" },
  { id: "TRX-2026-007", eventId: 1, buyer: "Tono Wijaya",    email: "tono@email.com",  ticketType: "VIP",        qty: 1, amount: 500000,  status: "Menunggu", date: "2026-03-28" },
  { id: "TRX-2026-008", eventId: 3, buyer: "Lina Susanti",   email: "lina@email.com",  ticketType: "VVIP",       qty: 1, amount: 750000,  status: "Berhasil", date: "2026-02-20" },
];

const statusColor: Record<TxStatus, string> = {
  Berhasil: "bg-green-100 text-green-700",
  Menunggu: "bg-yellow-100 text-yellow-700",
  Gagal:    "bg-red-100 text-red-600",
};

function getEventName(id: number, evList: { id: number; name: string }[]) {
  return evList.find((e) => e.id === id)?.name ?? "-";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function Transactions() {
  const events = useEventStore((s) => s.events);
  const [tab, setTab]               = useState<"transaksi" | "statistik">("transaksi");
  const [filterEvent, setFilterEvent] = useState<number | "Semua">("Semua");
  const [filterStatus, setFilterStatus] = useState<TxStatus | "Semua">("Semua");
  const [search, setSearch]         = useState("");

  // ── Filtered transactions ──────────────────────────────────────────────────
  const filteredTx = initialTransactions.filter((t) => {
    const matchEvent  = filterEvent === "Semua" || t.eventId === filterEvent;
    const matchStatus = filterStatus === "Semua" || t.status === filterStatus;
    const matchSearch = t.buyer.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());
    return matchEvent && matchStatus && matchSearch;
  });

  // ── Stats (respect filterEvent) ────────────────────────────────────────────
  const scopedTickets = filterEvent === "Semua" ? ticketPools : ticketPools.filter((t) => t.eventId === filterEvent);
  const scopedPromos  = filterEvent === "Semua" ? promoPools  : promoPools.filter((p) => p.eventId === filterEvent);
  const scopedTx      = filterEvent === "Semua" ? initialTransactions : initialTransactions.filter((t) => t.eventId === filterEvent);

  const totalQuota    = scopedTickets.reduce((s, t) => s + t.quota, 0);
  const totalSold     = scopedTickets.reduce((s, t) => s + t.sold, 0);
  const totalRevenue  = scopedTickets.reduce((s, t) => s + t.price * t.sold, 0);
  const activePromos  = scopedPromos.filter((p) => new Date(p.expiry) >= new Date()).length;

  const eventScope = filterEvent === "Semua" ? events : events.filter((e) => e.id === filterEvent);
  const byEvent = eventScope.map((ev) => {
    const evTickets = ticketPools.filter((t) => t.eventId === ev.id);
    const evSold    = evTickets.reduce((s, t) => s + t.sold, 0);
    const evQuota   = evTickets.reduce((s, t) => s + t.quota, 0);
    const evRevenue = evTickets.reduce((s, t) => s + t.price * t.sold, 0);
    const evPromos  = promoPools.filter((p) => p.eventId === ev.id).length;
    return { ev, evTickets, evSold, evQuota, evRevenue, evPromos };
  }).filter((x) => x.evTickets.length > 0);

  const byType = TICKET_TYPES.map((type) => {
    const typeTickets = scopedTickets.filter((t) => t.type === type);
    const sold    = typeTickets.reduce((s, t) => s + t.sold, 0);
    const quota   = typeTickets.reduce((s, t) => s + t.quota, 0);
    const revenue = typeTickets.reduce((s, t) => s + t.price * t.sold, 0);
    return { type, sold, quota, revenue };
  }).filter((x) => x.quota > 0);

  const maxRevenue = Math.max(...byEvent.map((x) => x.evRevenue), 1);
  const maxSold    = Math.max(...byEvent.map((x) => x.evSold), 1);

  // ── Summary card for transaksi tab ────────────────────────────────────────
  const successTx  = scopedTx.filter((t) => t.status === "Berhasil");
  const pendingTx  = scopedTx.filter((t) => t.status === "Menunggu");
  const failedTx   = scopedTx.filter((t) => t.status === "Gagal");
  const txRevenue  = successTx.reduce((s, t) => s + t.amount, 0);

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
          value={filterEvent === "Semua" ? "Semua" : String(filterEvent)}
          onChange={(e) => setFilterEvent(e.target.value === "Semua" ? "Semua" : Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="Semua">Semua Event</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
      </div>

      {/* ── TAB: Transaksi ── */}
      {tab === "transaksi" && (
        <div className="space-y-4">
          {/* Summary mini-cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Pendapatan", value: `Rp ${(txRevenue / 1_000_000).toFixed(1)}jt`, color: "text-green-600", bg: "bg-green-50" },
              { label: "Berhasil",  value: successTx.length, color: "text-green-600",  bg: "bg-green-50" },
              { label: "Menunggu",  value: pendingTx.length, color: "text-yellow-600", bg: "bg-yellow-50" },
              { label: "Gagal",     value: failedTx.length,  color: "text-red-500",    bg: "bg-red-50" },
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
              <option value="Gagal">Gagal</option>
            </select>
            <span className="text-xs text-gray-400 ml-auto">{filteredTx.length} transaksi</span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID Transaksi</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pembeli</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiket</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Promo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">Tidak ada transaksi ditemukan.</td>
                  </tr>
                ) : filteredTx.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">{t.id}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">{t.buyer}</p>
                      <p className="text-xs text-gray-400">{t.email}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs max-w-[140px] truncate">{getEventName(t.eventId, events)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticketTypeBadge[t.ticketType]}`}>
                        {t.ticketType}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{t.qty}</td>
                    <td className="px-5 py-4 font-semibold text-gray-700">Rp {t.amount.toLocaleString("id-ID")}</td>
                    <td className="px-5 py-4">
                      {t.promoCode
                        ? <span className="font-mono text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded tracking-widest">{t.promoCode}</span>
                        : <span className="text-gray-300 text-xs">—</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                sub: `dari ${totalQuota.toLocaleString("id-ID")} kuota`,
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
                sub: `dari ${scopedTickets.length} tipe tiket`,
                color: "text-green-600",
                bg: "bg-green-50",
                icon: (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                label: "Tingkat Penjualan",
                value: `${totalQuota ? Math.round((totalSold / totalQuota) * 100) : 0}%`,
                sub: "dari total kuota",
                color: "text-blue-600",
                bg: "bg-blue-50",
                icon: (
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
              },
              {
                label: "Promo Aktif",
                value: `${activePromos} / ${scopedPromos.length}`,
                sub: "kode kupon berlaku",
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
                          <span className="text-xs text-gray-600 truncate max-w-[55%]">{ev.name}</span>
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
                  {byEvent.map(({ ev, evSold, evQuota }) => {
                    const barPct  = Math.round((evSold / maxSold) * 100);
                    const soldPct = evQuota ? Math.round((evSold / evQuota) * 100) : 0;
                    const barColor = soldPct >= 100 ? "bg-red-400" : soldPct >= 80 ? "bg-yellow-400" : "bg-green-400";
                    return (
                      <div key={ev.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 truncate max-w-[55%]">{ev.name}</span>
                          <span className="text-xs font-semibold text-gray-700">
                            {evSold} <span className="text-gray-400 font-normal">/ {evQuota}</span>
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${soldPct >= 100 ? "bg-red-100 text-red-600" : soldPct >= 80 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                              {soldPct}%
                            </span>
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${barPct}%` }} />
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Terjual / Kuota</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tingkat Penjualan</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pendapatan</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Promo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byEvent.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Tidak ada data untuk ditampilkan.</td></tr>
                ) : byEvent.map(({ ev, evSold, evQuota, evRevenue, evPromos }) => {
                  const pct = evQuota ? Math.round((evSold / evQuota) * 100) : 0;
                  return (
                    <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-800">{ev.name}</td>
                      <td className="px-5 py-4 text-gray-600">{evSold} / {evQuota}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-yellow-400" : "bg-green-400"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-600">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-700 font-medium">Rp {evRevenue.toLocaleString("id-ID")}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${evPromos > 0 ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"}`}>
                          {evPromos} promo
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Per-Type Breakdown Cards */}
          {byType.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Performa per Tipe Tiket</h3>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {byType.map(({ type, sold, quota, revenue }) => {
                  const pct = quota ? Math.round((sold / quota) * 100) : 0;
                  return (
                    <div key={type} className="border border-gray-100 rounded-lg p-4 space-y-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticketTypeBadge[type]}`}>
                        {type}
                      </span>
                      <div>
                        <p className="text-lg font-bold text-gray-800">{sold} <span className="text-sm font-normal text-gray-400">/ {quota}</span></p>
                        <p className="text-xs text-gray-400 mt-0.5">tiket terjual</p>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-yellow-400" : "bg-green-400"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 font-medium">Rp {revenue.toLocaleString("id-ID")}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
