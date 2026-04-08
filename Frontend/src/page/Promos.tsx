import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8000/api";

type PromoType = "FLASH_SALE" | "VOUCHER" | "BUNDLE" | "LAINNYA";
const PROMO_TYPES: PromoType[] = ["FLASH_SALE", "VOUCHER", "BUNDLE", "LAINNYA"];
const promoTypeLabel: Record<PromoType, string> = {
  FLASH_SALE: "Flash Sale",
  VOUCHER: "Voucher",
  BUNDLE: "Bundle",
  LAINNYA: "Lainnya",
};
const promoTypeBadge: Record<PromoType, string> = {
  FLASH_SALE: "bg-red-100 text-red-600",
  VOUCHER: "bg-orange-100 text-orange-600",
  BUNDLE: "bg-blue-100 text-blue-600",
  LAINNYA: "bg-gray-100 text-gray-600",
};

interface EventItem {
  id: string;
  title: string;
}

interface PromoItem {
  id: string;
  event_id: string;
  name: string;
  type: PromoType;
  promotion_code: string;
  discount_amount: string;
  max_usage: number | null;
  used_count: number | null;
  expires_at: string | null;
  event?: { id: string; title: string };
}

const emptyPromoForm = {
  event_id: "",
  name: "",
  type: "VOUCHER" as PromoType,
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

export default function Promos() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [filterEventId, setFilterEventId] = useState<string>("Semua");

  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editPromoId, setEditPromoId] = useState<string | null>(null);
  const [promoForm, setPromoForm] = useState(emptyPromoForm);
  const [promoErrors, setPromoErrors] = useState<Partial<Record<string, string>>>({});

  // ── Data Fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") ?? "{}");
    const organizerId: string = user?.id ?? "";
    fetch(`${API_BASE}/events${organizerId ? `?organizer_id=${organizerId}` : ""}`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setEvents(data.data); })
      .catch(console.error);
  }, []);

  const fetchPromos = useCallback(() => {
    const user = JSON.parse(localStorage.getItem("user") ?? "{}");
    const organizerId: string = user?.id ?? "";
    const url =
      filterEventId !== "Semua"
        ? `${API_BASE}/promos?event_id=${filterEventId}`
        : organizerId
        ? `${API_BASE}/promos?organizer_id=${organizerId}`
        : `${API_BASE}/promos`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => { if (data.success) setPromos(data.data); })
      .catch(console.error);
  }, [filterEventId]);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function validatePromo() {
    const e: Record<string, string> = {};
    if (!promoForm.event_id) e.event_id = "Event wajib dipilih.";
    if (!promoForm.name.trim()) e.name = "Nama promo wajib diisi.";
    if (!promoForm.promotion_code.trim()) e.promotion_code = "Kode kupon wajib diisi.";
    if (!promoForm.discount_amount || Number(promoForm.discount_amount) <= 0)
      e.discount_amount = "Nominal diskon harus lebih dari 0.";
    if (!promoForm.max_usage || Number(promoForm.max_usage) <= 0)
      e.max_usage = "Maks. penggunaan wajib diisi.";
    if (!promoForm.expires_at) e.expires_at = "Tanggal kedaluwarsa wajib diisi.";
    return e;
  }

  async function handlePromoSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validatePromo();
    if (Object.keys(errs).length > 0) { setPromoErrors(errs); return; }
    const body = {
      event_id: promoForm.event_id,
      name: promoForm.name,
      type: promoForm.type,
      promotion_code: promoForm.promotion_code.toUpperCase(),
      discount_amount: Number(promoForm.discount_amount),
      max_usage: Number(promoForm.max_usage),
      expires_at: promoForm.expires_at,
    };
    try {
      const url = editPromoId ? `${API_BASE}/promos/${editPromoId}` : `${API_BASE}/promos`;
      const method = editPromoId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
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
      name: p.name,
      type: p.type,
      promotion_code: p.promotion_code,
      discount_amount: String(p.discount_amount),
      max_usage: String(p.max_usage ?? ""),
      expires_at: p.expires_at ? p.expires_at.substring(0, 10) : "",
    });
    setEditPromoId(p.id);
    setPromoErrors({});
    setShowPromoForm(true);
  }

  function handlePromoChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
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

  function getEventName(event_id: string, event?: { id: string; title: string }) {
    if (event) return event.title;
    return events.find((e) => e.id === event_id)?.title ?? "-";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Promo & Diskon</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola kode promo dan diskon untuk setiap event</p>
        </div>
        <button
          onClick={() => {
            setEditPromoId(null);
            setPromoForm(emptyPromoForm);
            setPromoErrors({});
            setShowPromoForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tambah Promo
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={filterEventId}
          onChange={(e) => setFilterEventId(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="Semua">Semua Event</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama Promo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jenis</th>
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
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada promo ditemukan.
                  </td>
                </tr>
              ) : (
                promos.map((p) => {
                  const expired = p.expires_at ? new Date(p.expires_at) < new Date() : false;
                  const used = p.used_count ?? 0;
                  const maxUse = p.max_usage ?? 0;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-gray-700 font-medium">{getEventName(p.event_id, p.event)}</td>
                      <td className="px-5 py-4 text-gray-700 font-medium">{p.name}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${promoTypeBadge[p.type]}`}>
                          {promoTypeLabel[p.type]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-0.5 rounded text-xs font-semibold tracking-widest">
                          {p.promotion_code}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-green-700 font-semibold">
                          Rp {Number(p.discount_amount).toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {maxUse > 0 ? (
                          <>
                            {used} / {maxUse}
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                              <div
                                className="h-full bg-orange-400 rounded-full"
                                style={{ width: `${Math.min((used / maxUse) * 100, 100)}%` }}
                              />
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
                              : new Date(p.expires_at).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                            : "Tidak ada batas"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditPromo(p)}
                            className="text-gray-400 hover:text-orange-500 transition-colors"
                            title="Edit promo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeletePromo(p.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Hapus promo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Tambah / Edit Promo ── */}
      {showPromoForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-800">
                {editPromoId !== null ? "Edit Promo" : "Tambah Promo & Diskon"}
              </h2>
              <button
                onClick={() => { setShowPromoForm(false); setEditPromoId(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handlePromoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Event</label>
                <select
                  name="event_id"
                  value={promoForm.event_id}
                  onChange={handlePromoChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${promoErrors.event_id ? "border-red-400" : "border-gray-200"}`}
                >
                  <option value="">-- Pilih Event --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
                {promoErrors.event_id && <p className="text-xs text-red-500 mt-1">{promoErrors.event_id}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nama Promo</label>
                  <input
                    name="name"
                    value={promoForm.name}
                    onChange={handlePromoChange}
                    placeholder="cth. Diskon Lebaran"
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${promoErrors.name ? "border-red-400" : "border-gray-200"}`}
                  />
                  {promoErrors.name && <p className="text-xs text-red-500 mt-1">{promoErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Promo</label>
                  <select
                    name="type"
                    value={promoForm.type}
                    onChange={handlePromoChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    {PROMO_TYPES.map((t) => (
                      <option key={t} value={t}>{promoTypeLabel[t]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kode Kupon</label>
                <div className="flex gap-2">
                  <input
                    name="promotion_code"
                    value={promoForm.promotion_code}
                    onChange={handlePromoChange}
                    placeholder="cth. DISC2026"
                    className={`flex-1 border rounded-lg px-3 py-2 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-orange-400 ${promoErrors.promotion_code ? "border-red-400" : "border-gray-200"}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPromoForm((prev) => ({
                        ...prev,
                        promotion_code: generateCode(prev.event_id, events),
                      }))
                    }
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Auto-generate
                  </button>
                </div>
                {promoErrors.promotion_code && (
                  <p className="text-xs text-red-500 mt-1">{promoErrors.promotion_code}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nominal Diskon (Rp)</label>
                  <input
                    type="number"
                    name="discount_amount"
                    value={promoForm.discount_amount}
                    onChange={handlePromoChange}
                    min={1}
                    placeholder="cth. 50000"
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${promoErrors.discount_amount ? "border-red-400" : "border-gray-200"}`}
                  />
                  {promoErrors.discount_amount && (
                    <p className="text-xs text-red-500 mt-1">{promoErrors.discount_amount}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Maks. Penggunaan</label>
                  <input
                    type="number"
                    name="max_usage"
                    value={promoForm.max_usage}
                    onChange={handlePromoChange}
                    min={1}
                    placeholder="cth. 100"
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${promoErrors.max_usage ? "border-red-400" : "border-gray-200"}`}
                  />
                  {promoErrors.max_usage && (
                    <p className="text-xs text-red-500 mt-1">{promoErrors.max_usage}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Berlaku Hingga</label>
                <input
                  type="date"
                  name="expires_at"
                  value={promoForm.expires_at}
                  onChange={handlePromoChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${promoErrors.expires_at ? "border-red-400" : "border-gray-200"}`}
                />
                {promoErrors.expires_at && (
                  <p className="text-xs text-red-500 mt-1">{promoErrors.expires_at}</p>
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowPromoForm(false); setEditPromoId(null); }}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
                >
                  {editPromoId !== null ? "Simpan Perubahan" : "Simpan Promo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
