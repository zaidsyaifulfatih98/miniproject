import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE;

type DBTicketType = "FREE" | "EARLY_BIRD" | "REGULAR" | "VIP" | "VVIP";

interface Attendee {
  id: string;
  display_id: string | null;
  quantity: number | null;
  final_price: string | null;
  total_price: string | null;
  createdAt: string;
  user: { id: string; full_name: string; email: string };
  ticket: { id: string; type: DBTicketType };
}

interface EventOption {
  id: string;
  title: string;
}

const ticketBadge: Record<DBTicketType, string> = {
  FREE: "bg-gray-100 text-gray-600",
  EARLY_BIRD: "bg-green-100 text-green-700",
  REGULAR: "bg-blue-100 text-blue-700",
  VIP: "bg-purple-100 text-purple-700",
  VVIP: "bg-yellow-100 text-yellow-800",
};

const ticketLabel: Record<DBTicketType, string> = {
  FREE: "Free",
  EARLY_BIRD: "Early Bird",
  REGULAR: "Reguler",
  VIP: "VIP",
  VVIP: "VVIP",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function Attendees() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents]       = useState<EventOption[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");

  const selectedEventId = searchParams.get("event_id") ?? "";

  // ── Fetch organizer's events ───────────────────────────────────────────────
  useEffect(() => {
    const user  = JSON.parse(localStorage.getItem("user") ?? "{}");
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/events?organizer_id=${user?.id ?? ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const active = (res.data as EventOption[]).filter(
            (e: any) => e.status === "ACTIVE" || e.status === "COMPLETED"
          );
          setEvents(active);
        }
      })
      .catch(() => {});
  }, []);

  // ── Fetch attendees when event selected ───────────────────────────────────
  const fetchAttendees = useCallback(() => {
    if (!selectedEventId) { setAttendees([]); return; }
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/bookings/attendees?event_id=${selectedEventId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => { if (res.success) setAttendees(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedEventId]);

  useEffect(() => { fetchAttendees(); }, [fetchAttendees]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = attendees.filter((a) =>
    a.user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.user.email.toLowerCase().includes(search.toLowerCase()) ||
    (a.display_id ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalTickets = filtered.reduce((s, a) => s + (a.quantity ?? 0), 0);
  const totalRevenue = filtered.reduce((s, a) => s + Number(a.final_price ?? a.total_price ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Daftar Peserta</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lihat peserta yang telah konfirmasi pembayaran per event</p>
        </div>
      </div>

      {/* Event picker */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Pilih Event</label>
        <select
          value={selectedEventId}
          onChange={(e) => setSearchParams(e.target.value ? { event_id: e.target.value } : {})}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">-- Pilih event --</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Peserta", value: filtered.length, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Total Tiket", value: totalTickets, color: "text-orange-600", bg: "bg-orange-50" },
              { label: "Total Pendapatan", value: `Rp ${(totalRevenue / 1_000_000).toFixed(1)}jt`, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-xs text-gray-500 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, email, atau ID..."
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} peserta</span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama Peserta</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiket</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Bayar</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal Pesan</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID Booking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Memuat data...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Belum ada peserta untuk event ini.</td></tr>
                  ) : (
                    filtered.map((a, i) => (
                      <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-5 py-4 font-medium text-gray-800">{a.user.full_name}</td>
                        <td className="px-5 py-4 text-gray-500 text-xs">{a.user.email}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticketBadge[a.ticket.type]}`}>
                            {ticketLabel[a.ticket.type]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-700 font-semibold">{a.quantity ?? 0}</td>
                        <td className="px-5 py-4 font-semibold text-gray-700">
                          Rp {Number(a.final_price ?? a.total_price ?? 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(a.createdAt)}</td>
                        <td className="px-5 py-4 font-mono text-xs text-gray-400">
                          {a.display_id ?? a.id.slice(0, 8).toUpperCase()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td colSpan={4} className="px-5 py-3 text-xs font-semibold text-gray-600">Total</td>
                      <td className="px-5 py-3 text-sm font-bold text-gray-800">{totalTickets}</td>
                      <td className="px-5 py-3 text-sm font-bold text-emerald-700">
                        Rp {totalRevenue.toLocaleString("id-ID")}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {!selectedEventId && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">Pilih event untuk melihat daftar peserta</p>
        </div>
      )}
    </div>
  );
}
