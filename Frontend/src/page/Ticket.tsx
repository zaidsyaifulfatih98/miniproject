
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

interface TicketItem {
  id: number;
  eventId: number;
  type: TicketType;
  price: number;
  quota: number;
  sold: number;
  description: string;
}

interface PromoItem {
  id: number;
  eventId: number;
  code: string;
  discount: number; // percent
  maxUse: number;
  used: number;
  expiry: string;
}

const initialTickets: TicketItem[] = [
  { id: 1, eventId: 1, type: "Early Bird", price: 150000, quota: 200, sold: 180, description: "Harga spesial pembelian awal." },
  { id: 2, eventId: 1, type: "Reguler", price: 250000, quota: 500, sold: 120, description: "Tiket reguler standar." },
  { id: 3, eventId: 1, type: "VIP", price: 500000, quota: 100, sold: 60, description: "Akses area khusus VIP." },
  { id: 4, eventId: 2, type: "Reguler", price: 100000, quota: 150, sold: 90, description: "Termasuk materi workshop." },
  { id: 5, eventId: 2, type: "VIP", price: 200000, quota: 50, sold: 30, description: "Konsultasi 1-on-1 dengan mentor." },
  { id: 6, eventId: 3, type: "VVIP", price: 750000, quota: 20, sold: 20, description: "Meja utama + networking dinner." },
];

const initialPromos: PromoItem[] = [
  { id: 1, eventId: 1, code: "KONSER20", discount: 20, maxUse: 100, used: 45, expiry: "2026-04-10" },
  { id: 2, eventId: 2, code: "WORKSHOP15", discount: 15, maxUse: 50, used: 12, expiry: "2026-05-01" },
];

const emptyTicketForm = {
  eventId: 1,
  type: "Reguler" as TicketType,
  price: "",
  quota: "",
  description: "",
};

const emptyPromoForm = {
  eventId: 1,
  code: "",
  discount: "",
  maxUse: "",
  expiry: "",
};

function generateCode(eventId: number, events: { id: number; name: string }[]): string {
  const ev = events.find((e) => e.id === eventId);
  const prefix = (ev?.name ?? "EVENT").substring(0, 4).toUpperCase().replace(/\s/g, "");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${suffix}`;
}

export default function Ticket() {
  const events = useEventStore((s) => s.events);
  const [tab, setTab] = useState<"tiket" | "promo">("tiket");
  const [tickets, setTickets] = useState<TicketItem[]>(initialTickets);
  const [promos, setPromos] = useState<PromoItem[]>(initialPromos);

  // Ticket form state
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [editTicketId, setEditTicketId] = useState<number | null>(null);
  const [ticketForm, setTicketForm] = useState(emptyTicketForm);
  const [ticketErrors, setTicketErrors] = useState<Partial<Record<string, string>>>({});

  // Promo form state
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editPromoId, setEditPromoId] = useState<number | null>(null);
  const [promoForm, setPromoForm] = useState(emptyPromoForm);
  const [promoErrors, setPromoErrors] = useState<Partial<Record<string, string>>>({});

  // Filters
  const [filterEvent, setFilterEvent] = useState<number | "Semua">("Semua");

  // ── Ticket handlers ────────────────────────────────────────────────────────
  function validateTicket() {
    const e: Record<string, string> = {};
    if (!ticketForm.price || Number(ticketForm.price) <= 0) e.price = "Harga harus lebih dari 0.";
    if (!ticketForm.quota || Number(ticketForm.quota) <= 0) e.quota = "Kuota harus lebih dari 0.";
    if (!ticketForm.description.trim()) e.description = "Deskripsi wajib diisi.";
    return e;
  }

  function handleTicketSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateTicket();
    if (Object.keys(errs).length > 0) { setTicketErrors(errs); return; }
    const ticketData = {
      eventId: Number(ticketForm.eventId),
      type: ticketForm.type,
      price: Number(ticketForm.price),
      quota: Number(ticketForm.quota),
      description: ticketForm.description,
    };
    if (editTicketId !== null) {
      setTickets((prev) => prev.map((t) => t.id === editTicketId ? { ...t, ...ticketData } : t));
    } else {
      setTickets((prev) => [
        ...prev,
        { id: prev.length ? Math.max(...prev.map((t) => t.id)) + 1 : 1, sold: 0, ...ticketData },
      ]);
    }
    setTicketForm(emptyTicketForm);
    setTicketErrors({});
    setShowTicketForm(false);
    setEditTicketId(null);
  }

  function handleEditTicket(id: number) {
    const t = tickets.find((x) => x.id === id);
    if (!t) return;
    setTicketForm({
      eventId: t.eventId,
      type: t.type,
      price: String(t.price),
      quota: String(t.quota),
      description: t.description,
    });
    setEditTicketId(id);
    setTicketErrors({});
    setShowTicketForm(true);
  }

  function handleTicketChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setTicketForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setTicketErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  function handleDeleteTicket(id: number) {
    setTickets((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Promo handlers ─────────────────────────────────────────────────────────
  function validatePromo() {
    const e: Record<string, string> = {};
    if (!promoForm.code.trim()) e.code = "Kode kupon wajib diisi.";
    if (!promoForm.discount || Number(promoForm.discount) <= 0 || Number(promoForm.discount) > 100)
      e.discount = "Diskon harus antara 1–100%.";
    if (!promoForm.maxUse || Number(promoForm.maxUse) <= 0) e.maxUse = "Maks. penggunaan wajib diisi.";
    if (!promoForm.expiry) e.expiry = "Tanggal kedaluwarsa wajib diisi.";
    return e;
  }

  function handlePromoSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validatePromo();
    if (Object.keys(errs).length > 0) { setPromoErrors(errs); return; }
    const promoData = {
      eventId: Number(promoForm.eventId),
      code: promoForm.code.toUpperCase(),
      discount: Number(promoForm.discount),
      maxUse: Number(promoForm.maxUse),
      expiry: promoForm.expiry,
    };
    if (editPromoId !== null) {
      setPromos((prev) => prev.map((p) => p.id === editPromoId ? { ...p, ...promoData } : p));
    } else {
      setPromos((prev) => [
        ...prev,
        { id: prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1, used: 0, ...promoData },
      ]);
    }
    setPromoForm(emptyPromoForm);
    setPromoErrors({});
    setShowPromoForm(false);
    setEditPromoId(null);
  }

  function handleEditPromo(id: number) {
    const p = promos.find((x) => x.id === id);
    if (!p) return;
    setPromoForm({
      eventId: p.eventId,
      code: p.code,
      discount: String(p.discount),
      maxUse: String(p.maxUse),
      expiry: p.expiry,
    });
    setEditPromoId(id);
    setPromoErrors({});
    setShowPromoForm(true);
  }

  function handlePromoChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setPromoForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPromoErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  function handleDeletePromo(id: number) {
    setPromos((prev) => prev.filter((p) => p.id !== id));
  }

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filteredTickets = filterEvent === "Semua" ? tickets : tickets.filter((t) => t.eventId === filterEvent);
  const filteredPromos = filterEvent === "Semua" ? promos : promos.filter((p) => p.eventId === filterEvent);

  function getEventName(id: number) {
    return events.find((e) => e.id === id)?.name ?? "-";
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
            else if (tab === "promo") { setEditPromoId(null); setPromoForm(emptyPromoForm); setPromoErrors({}); setShowPromoForm(true); }
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
          value={filterEvent === "Semua" ? "Semua" : String(filterEvent)}
          onChange={(e) => setFilterEvent(e.target.value === "Semua" ? "Semua" : Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="Semua">Semua Event</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
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
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Tidak ada tiket ditemukan.</td>
                </tr>
              ) : filteredTickets.map((t) => {
                const sisa = t.quota - t.sold;
                const pct = Math.round((t.sold / t.quota) * 100);
                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-700 font-medium">{getEventName(t.eventId)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticketTypeBadge[t.type]}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">Rp {t.price.toLocaleString("id-ID")}</td>
                    <td className="px-5 py-4 text-gray-700">{t.quota}</td>
                    <td className="px-5 py-4 text-gray-700">{t.sold}</td>
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
                        <button onClick={() => handleEditTicket(t.id)} className="text-gray-400 hover:text-orange-500 transition-colors" title="Edit tiket">
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
              {filteredPromos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Tidak ada promo ditemukan.</td>
                </tr>
              ) : filteredPromos.map((p) => {
                const expired = new Date(p.expiry) < new Date();
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-700 font-medium">{getEventName(p.eventId)}</td>
                    <td className="px-5 py-4">
                      <span className="font-mono bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-0.5 rounded text-xs font-semibold tracking-widest">
                        {p.code}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-green-700 font-semibold">{p.discount}%</span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {p.used} / {p.maxUse}
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.min((p.used / p.maxUse) * 100, 100)}%` }} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${expired ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                        {expired ? "Kedaluwarsa" : new Date(p.expiry).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEditPromo(p.id)} className="text-gray-400 hover:text-orange-500 transition-colors" title="Edit promo">
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
                <select name="eventId" value={ticketForm.eventId} onChange={handleTicketChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400">
                  {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipe Tiket</label>
                  <select name="type" value={ticketForm.type} onChange={handleTicketChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400">
                    {TICKET_TYPES.map((t) => <option key={t}>{t}</option>)}
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
                <select name="eventId" value={promoForm.eventId} onChange={handlePromoChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400">
                  {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kode Kupon</label>
                <div className="flex gap-2">
                  <input name="code" value={promoForm.code} onChange={handlePromoChange}
                    placeholder="cth. DISC2026"
                    className={`flex-1 border rounded-lg px-3 py-2 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-orange-400 ${promoErrors.code ? "border-red-400" : "border-gray-200"}`} />
                  <button type="button"
                    onClick={() => setPromoForm((prev) => ({ ...prev, code: generateCode(Number(prev.eventId), events) }))}
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap">
                    Auto-generate
                  </button>
                </div>
                {promoErrors.code && <p className="text-xs text-red-500 mt-1">{promoErrors.code}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Diskon (%)</label>
                  <input type="number" name="discount" value={promoForm.discount} onChange={handlePromoChange} min={1} max={100}
                    placeholder="cth. 20"
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${promoErrors.discount ? "border-red-400" : "border-gray-200"}`} />
                  {promoErrors.discount && <p className="text-xs text-red-500 mt-1">{promoErrors.discount}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Maks. Penggunaan</label>
                  <input type="number" name="maxUse" value={promoForm.maxUse} onChange={handlePromoChange} min={1}
                    placeholder="cth. 100"
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${promoErrors.maxUse ? "border-red-400" : "border-gray-200"}`} />
                  {promoErrors.maxUse && <p className="text-xs text-red-500 mt-1">{promoErrors.maxUse}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Berlaku Hingga</label>
                <input type="date" name="expiry" value={promoForm.expiry} onChange={handlePromoChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${promoErrors.expiry ? "border-red-400" : "border-gray-200"}`} />
                {promoErrors.expiry && <p className="text-xs text-red-500 mt-1">{promoErrors.expiry}</p>}
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
