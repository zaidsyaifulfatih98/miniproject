
import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8000/api";

type TicketType = "FREE" | "EARLY_BIRD" | "REGULAR" | "VIP" | "VVIP";
const TICKET_TYPES: TicketType[] = ["FREE", "EARLY_BIRD", "REGULAR", "VIP", "VVIP"];

const ticketTypeLabel: Record<TicketType, string> = {
  FREE: "Free",
  EARLY_BIRD: "Early Bird",
  REGULAR: "Reguler",
  VIP: "VIP",
  VVIP: "VVIP",
};

const ticketTypeBadge: Record<TicketType, string> = {
  FREE: "bg-gray-100 text-gray-600",
  EARLY_BIRD: "bg-green-100 text-green-700",
  REGULAR: "bg-blue-100 text-blue-700",
  VIP: "bg-purple-100 text-purple-700",
  VVIP: "bg-yellow-100 text-yellow-700",
};

interface EventItem {
  id: string;
  title: string;
}

interface TicketItem {
  id: string;
  event_id: string;
  type: TicketType;
  price: string;
  quota: number;
  used_ticket: number;
  description: string;
}

interface PromoItem {
  id: string;
  event_id: string;
  promotion_code: string;
  discount_amount: string;
  max_usage: number | null;
  used_count: number | null;
  expires_at: string | null;
  event?: { id: string; title: string };
}

const emptyTicketForm = {
  event_id: "",
  type: "REGULAR" as TicketType,
  price: "",
  quota: "",
  description: "",
};

const emptyPromoForm = {
  event_id: "",
  promotion_code: "",
  discount_amount: "",
  max_usage: "",
  expires_at: "",
};

function generateCode(eventId: string, events: EventItem[]): string {
  const ev = events.find((e) => e.id === eventId);
  const prefix = (ev?.title ?? "EVENT").substring(0, 4).toUpperCase().replace(/\s/g, "");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${suffix}`;
}

export default function Ticket() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tab, setTab] = useState<"tiket" | "promo">("tiket");
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [filterEventId, setFilterEventId] = useState<string>("Semua");

  // Ticket form state
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [editTicketId, setEditTicketId] = useState<string | null>(null);
  const [ticketForm, setTicketForm] = useState(emptyTicketForm);
  const [ticketErrors, setTicketErrors] = useState<Partial<Record<string, string>>>({});

  // Promo form state
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editPromoId, setEditPromoId] = useState<string | null>(null);
  const [promoForm, setPromoForm] = useState(emptyPromoForm);
  const [promoErrors, setPromoErrors] = useState<Partial<Record<string, string>>>({});

  // ── Data Fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/events`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setEvents(data.data); })
      .catch(console.error);
  }, []);

  const fetchTickets = useCallback(() => {
    const url = filterEventId === "Semua"
      ? `${API_BASE}/tickets`
      : `${API_BASE}/tickets?event_id=${filterEventId}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => { if (data.success) setTickets(data.data); })
      .catch(console.error);
  }, [filterEventId]);

  const fetchPromos = useCallback(() => {
    const url = filterEventId === "Semua"
      ? `${API_BASE}/promos`
      : `${API_BASE}/promos?event_id=${filterEventId}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => { if (data.success) setPromos(data.data); })
      .catch(console.error);
  }, [filterEventId]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  // ── Ticket handlers ────────────────────────────────────────────────────────
  function validateTicket() {
    const e: Record<string, string> = {};
    if (!ticketForm.event_id) e.event_id = "Event wajib dipilih.";
    if (!ticketForm.price || Number(ticketForm.price) <= 0) e.price = "Harga harus lebih dari 0.";
    if (!ticketForm.quota || Number(ticketForm.quota) <= 0) e.quota = "Kuota harus lebih dari 0.";
    if (!ticketForm.description.trim()) e.description = "Deskripsi wajib diisi.";
    return e;
  }

  async function handleTicketSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateTicket();
    if (Object.keys(errs).length > 0) { setTicketErrors(errs); return; }
    const body = {
      event_id: ticketForm.event_id,
      type: ticketForm.type,
      price: Number(ticketForm.price),
      quota: Number(ticketForm.quota),
      description: ticketForm.description,
    };
    try {
      const url = editTicketId ? `${API_BASE}/tickets/${editTicketId}` : `${API_BASE}/tickets`;
      const method = editTicketId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) { alert(data.message); return; }
      fetchTickets();
      setTicketForm(emptyTicketForm);
      setTicketErrors({});
      setShowTicketForm(false);
      setEditTicketId(null);
    } catch (err) {
      console.error(err);
    }
  }

  function handleEditTicket(t: TicketItem) {
    setTicketForm({
      event_id: t.event_id,
      type: t.type,
      price: String(t.price),
      quota: String(t.quota),
      description: t.description,
    });
    setEditTicketId(t.id);
    setTicketErrors({});
    setShowTicketForm(true);
  }

  function handleTicketChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setTicketForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setTicketErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  async function handleDeleteTicket(id: string) {
    if (!confirm("Hapus tiket ini?")) return;
    try {
      await fetch(`${API_BASE}/tickets/${id}`, { method: "DELETE" });
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  }

  // ── Promo handlers ─────────────────────────────────────────────────────────
  function validatePromo() {
    const e: Record<string, string> = {};
    if (!promoForm.event_id) e.event_id = "Event wajib dipilih.";
    if (!promoForm.promotion_code.trim()) e.promotion_code = "Kode kupon wajib diisi.";
    if (!promoForm.discount_amount || Number(promoForm.discount_amount) <= 0)
      e.discount_amount = "Nominal diskon harus lebih dari 0.";
    if (!promoForm.max_usage || Number(promoForm.max_usage) <= 0) e.max_usage = "Maks. penggunaan wajib diisi.";
    if (!promoForm.expires_at) e.expires_at = "Tanggal kedaluwarsa wajib diisi.";
    return e;
  }

  async function handlePromoSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validatePromo();
    if (Object.keys(errs).length > 0) { setPromoErrors(errs); return; }
    const body = {
      event_id: promoForm.event_id,
      promotion_code: promoForm.promotion_code.toUpperCase(),
      discount_amount: Number(promoForm.discount_amount),
      max_usage: Number(promoForm.max_usage),
      expires_at: promoForm.expires_at,
    };
    try {
      const url = editPromoId ? `${API_BASE}/promos/${editPromoId}` : `${API_BASE}/promos`;
      const method = editPromoId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) { alert(data.message); return; }
      fetchPromos();
      setPromoForm(emptyPromoForm);
      setPromoErrors({});
      setShowPromoForm(false);
      setEditPromoId(null);
    } catch (err) {
      console.error(err);
    }
  }

  function handleEditPromo(p: PromoItem) {
    setPromoForm({
      event_id: p.event_id,
      promotion_code: p.promotion_code,
      discount_amount: String(p.discount_amount),
      max_usage: String(p.max_usage ?? ""),
      expires_at: p.expires_at ? p.expires_at.substring(0, 10) : "",
    });
    setEditPromoId(p.id);
    setPromoErrors({});
    setShowPromoForm(true);
  }

  function handlePromoChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setPromoForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPromoErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  async function handleDeletePromo(id: string) {
    if (!confirm("Hapus promo ini?")) return;
    try {
      await fetch(`${API_BASE}/promos/${id}`, { method: "DELETE" });
      fetchPromos();
    } catch (err) {
      console.error(err);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function getEventName(event_id: string, event?: { id: string; title: string }) {
    if (event) return event.title;
    return events.find((e) => e.id === event_id)?.title ?? "-";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Manajemen Tiket</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola tipe tiket, kuota stok, dan promo diskon</p>
        </div>
        <button
          onClick={() => {
            if (tab === "tiket") { setEditTicketId(null); setTicketForm(emptyTicketForm); setTicketErrors({}); setShowTicketForm(true); }
            else { setEditPromoId(null); setPromoForm(emptyPromoForm); setPromoErrors({}); setShowPromoForm(true); }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {tab === "tiket" ? "Tambah Tiket" : "Tambah Promo"}
        </button>
      </div>

      {/* Tabs + Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(["tiket", "promo"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "tiket" ? "Tipe Tiket & Stok" : "Promo & Diskon"}
            </button>
          ))}
        </div>
        <select
          value={filterEventId}
          onChange={(e) => setFilterEventId(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="Semua">Semua Event</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
      </div>

      {/* ── TAB: Tiket ── */}
      {tab === "tiket" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipe</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kuota</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Terjual</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sisa</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Deskripsi</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Tidak ada tiket ditemukan.</td>
                </tr>
              ) : tickets.map((t) => {
                const sisa = t.quota - t.used_ticket;
                const pct = t.quota > 0 ? Math.round((t.used_ticket / t.quota) * 100) : 0;
                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-700 font-medium">{getEventName(t.event_id)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticketTypeBadge[t.type]}`}>
                        {ticketTypeLabel[t.type]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">Rp {Number(t.price).toLocaleString("id-ID")}</td>
                    <td className="px-5 py-4 text-gray-700">{t.quota}</td>
                    <td className="px-5 py-4 text-gray-700">{t.used_ticket}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-yellow-400" : "bg-green-400"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${sisa === 0 ? "text-red-500" : "text-gray-600"}`}>
                          {sisa === 0 ? "Habis" : sisa}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs max-w-[160px] truncate">{t.description}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEditTicket(t)} className="text-gray-400 hover:text-orange-500 transition-colors" title="Edit tiket">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteTicket(t.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Hapus tiket">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB: Promo ── */}
      {tab === "promo" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kode Kupon</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Diskon</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Penggunaan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kedaluwarsa</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {promos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Tidak ada promo ditemukan.</td>
                </tr>
              ) : promos.map((p) => {
                const expired = p.expires_at ? new Date(p.expires_at) < new Date() : false;
                const used = p.used_count ?? 0;
                const maxUse = p.max_usage ?? 0;
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-700 font-medium">{getEventName(p.event_id, p.event)}</td>
                    <td className="px-5 py-4">
                      <span className="font-mono bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-0.5 rounded text-xs font-semibold tracking-widest">
                        {p.promotion_code}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-green-700 font-semibold">Rp {Number(p.discount_amount).toLocaleString("id-ID")}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {maxUse > 0 ? (
                        <>
                          {used} / {maxUse}
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.min((used / maxUse) * 100, 100)}%` }} />
                          </div>
                        </>
                      ) : (
                        <>{used} / ∞</>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${expired ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                        {p.expires_at
                          ? expired
                            ? "Kedaluwarsa"
                            : new Date(p.expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                          : "Tidak ada batas"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEditPromo(p)} className="text-gray-400 hover:text-orange-500 transition-colors" title="Edit promo">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeletePromo(p.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Hapus promo">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal: Tambah Tiket ── */}
      {showTicketForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-800">{editTicketId !== null ? "Edit Tiket" : "Tambah Tiket Baru"}</h2>
              <button onClick={() => { setShowTicketForm(false); setEditTicketId(null); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Event</label>
                <select name="event_id" value={ticketForm.event_id} onChange={handleTicketChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${ticketErrors.event_id ? "border-red-400" : "border-gray-200"}`}>
                  <option value="">-- Pilih Event --</option>
                  {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
                {ticketErrors.event_id && <p className="text-xs text-red-500 mt-1">{ticketErrors.event_id}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipe Tiket</label>
                  <select name="type" value={ticketForm.type} onChange={handleTicketChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400">
                    {TICKET_TYPES.map((t) => <option key={t} value={t}>{ticketTypeLabel[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Harga (Rp)</label>
                  <input type="number" name="price" value={ticketForm.price} onChange={handleTicketChange} min={0}
                    placeholder="cth. 250000"
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${ticketErrors.price ? "border-red-400" : "border-gray-200"}`} />
                  {ticketErrors.price && <p className="text-xs text-red-500 mt-1">{ticketErrors.price}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kuota / Stok Maksimal</label>
                <input type="number" name="quota" value={ticketForm.quota} onChange={handleTicketChange} min={1}
                  placeholder="cth. 500"
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${ticketErrors.quota ? "border-red-400" : "border-gray-200"}`} />
                {ticketErrors.quota && <p className="text-xs text-red-500 mt-1">{ticketErrors.quota}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi</label>
                <textarea name="description" value={ticketForm.description} onChange={handleTicketChange} rows={2}
                  placeholder="Keuntungan atau catatan tiket ini..."
                  className={`w-full border rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-orange-400 ${ticketErrors.description ? "border-red-400" : "border-gray-200"}`} />
                {ticketErrors.description && <p className="text-xs text-red-500 mt-1">{ticketErrors.description}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowTicketForm(false); setEditTicketId(null); }}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Batal</button>
                <button type="submit"
                  className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors">{editTicketId !== null ? "Simpan Perubahan" : "Simpan Tiket"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Tambah Promo ── */}
      {showPromoForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-800">{editPromoId !== null ? "Edit Promo" : "Tambah Promo & Diskon"}</h2>
              <button onClick={() => { setShowPromoForm(false); setEditPromoId(null); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handlePromoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Event</label>
                <select name="event_id" value={promoForm.event_id} onChange={handlePromoChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${promoErrors.event_id ? "border-red-400" : "border-gray-200"}`}>
                  <option value="">-- Pilih Event --</option>
                  {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
                {promoErrors.event_id && <p className="text-xs text-red-500 mt-1">{promoErrors.event_id}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kode Kupon</label>
                <div className="flex gap-2">
                  <input name="promotion_code" value={promoForm.promotion_code} onChange={handlePromoChange}
                    placeholder="cth. DISC2026"
                    className={`flex-1 border rounded-lg px-3 py-2 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-orange-400 ${promoErrors.promotion_code ? "border-red-400" : "border-gray-200"}`} />
                  <button type="button"
                    onClick={() => setPromoForm((prev) => ({ ...prev, promotion_code: generateCode(prev.event_id, events) }))}
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap">
                    Auto-generate
                  </button>
                </div>
                {promoErrors.promotion_code && <p className="text-xs text-red-500 mt-1">{promoErrors.promotion_code}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nominal Diskon (Rp)</label>
                  <input type="number" name="discount_amount" value={promoForm.discount_amount} onChange={handlePromoChange} min={1}
                    placeholder="cth. 50000"
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${promoErrors.discount_amount ? "border-red-400" : "border-gray-200"}`} />
                  {promoErrors.discount_amount && <p className="text-xs text-red-500 mt-1">{promoErrors.discount_amount}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Maks. Penggunaan</label>
                  <input type="number" name="max_usage" value={promoForm.max_usage} onChange={handlePromoChange} min={1}
                    placeholder="cth. 100"
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${promoErrors.max_usage ? "border-red-400" : "border-gray-200"}`} />
                  {promoErrors.max_usage && <p className="text-xs text-red-500 mt-1">{promoErrors.max_usage}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Berlaku Hingga</label>
                <input type="date" name="expires_at" value={promoForm.expires_at} onChange={handlePromoChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${promoErrors.expires_at ? "border-red-400" : "border-gray-200"}`} />
                {promoErrors.expires_at && <p className="text-xs text-red-500 mt-1">{promoErrors.expires_at}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowPromoForm(false); setEditPromoId(null); }}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Batal</button>
                <button type="submit"
                  className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors">{editPromoId !== null ? "Simpan Perubahan" : "Simpan Promo"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
