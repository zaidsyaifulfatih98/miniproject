
import { useState, useRef, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8000/api";

type EventStatus = "DRAFT" | "PENDING" | "ACTIVE" | "REJECTED" | "COMPLETED" | "CANCELLED";
type EventCategory = "Konser" | "Workshop" | "Seminar" | "Festival" | "Olahraga" | "Lainnya";

interface EventItem {
  id: string;
  title: string;
  location: string | null;
  start_event: string | null;
  end_event: string | null;
  start_time: string | null;
  end_time: string | null;
  total_seats: number;
  available_seats: number;
  banner: string;
  description: string | null;
  category: string | null;
  status: EventStatus;
  price: string;
}

const CATEGORIES: EventCategory[] = ["Konser", "Workshop", "Seminar", "Festival", "Olahraga", "Lainnya"];
const STATUSES: EventStatus[] = ["DRAFT", "PENDING", "ACTIVE", "REJECTED", "COMPLETED", "CANCELLED"];

const statusColor: Record<EventStatus, string> = {
  DRAFT:     "bg-yellow-100 text-yellow-700",
  PENDING:   "bg-orange-100 text-orange-700",
  ACTIVE:    "bg-green-100 text-green-700",
  REJECTED:  "bg-red-100 text-red-600",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-50 text-red-400",
};

const statusLabel: Record<EventStatus, string> = {
  DRAFT:     "Draft",
  PENDING:   "Pending",
  ACTIVE:    "Active",
  REJECTED:  "Rejected",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const categoryColor: Record<EventCategory, string> = {
  Konser: "bg-purple-100 text-purple-700",
  Workshop: "bg-blue-100 text-blue-700",
  Seminar: "bg-orange-100 text-orange-700",
  Festival: "bg-pink-100 text-pink-700",
  Olahraga: "bg-teal-100 text-teal-700",
  Lainnya: "bg-gray-100 text-gray-600",
};

const emptyForm = {
  title: "",
  location: "",
  dateStart: "",
  dateEnd: "",
  timeStart: "",
  timeEnd: "",
  total_seats: "",
  price: "",
  banner: "",
  description: "",
  category: "Konser" as EventCategory,
  status: "DRAFT" as EventStatus,
  organizer_id: "",
};

export default function Event() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof emptyForm, string>>>({});
  const [filterCategory, setFilterCategory] = useState<EventCategory | "Semua">("Semua");
  const [filterStatus, setFilterStatus] = useState<EventStatus | "Semua">("Semua");
  const [search, setSearch] = useState("");
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filterCategory !== "Semua") params.set("category", filterCategory);
      if (filterStatus !== "Semua") params.set("status", filterStatus);
      if (search) params.set("search", search);
      const res = await fetch(`${API_BASE}/events?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat data event");
      const json = await res.json();
      setEvents(json.data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStatus, search]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchEvents(), 300);
    return () => clearTimeout(debounce);
  }, [fetchEvents]);

  function validate() {
    const e: Partial<Record<keyof typeof emptyForm, string>> = {};
    if (!form.title.trim()) e.title = "Nama event wajib diisi.";
    if (!form.location.trim()) e.location = "Lokasi wajib diisi.";
    if (!form.dateStart) e.dateStart = "Tanggal mulai wajib diisi.";
    if (!form.dateEnd) e.dateEnd = "Tanggal berakhir wajib diisi.";
    if (form.dateStart && form.dateEnd && form.dateEnd < form.dateStart)
      e.dateEnd = "Tanggal berakhir tidak boleh sebelum tanggal mulai.";
    if (!form.timeStart) e.timeStart = "Waktu mulai wajib diisi.";
    if (!form.timeEnd) e.timeEnd = "Waktu selesai wajib diisi.";
    if (form.timeStart && form.timeEnd && form.timeEnd <= form.timeStart)
      e.timeEnd = "Waktu selesai harus setelah waktu mulai.";
    if (!form.total_seats || isNaN(Number(form.total_seats)) || Number(form.total_seats) <= 0)
      e.total_seats = "Kapasitas venue harus lebih dari 0.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      e.price = "Harga tidak valid.";
    if (!form.description.trim()) e.description = "Deskripsi wajib diisi.";
    if (!form.organizer_id.trim()) e.organizer_id = "Organizer ID wajib diisi.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const payload = {
      organizer_id: form.organizer_id,
      title: form.title,
      location: form.location,
      description: form.description,
      category: form.category,
      status: form.status,
      price: Number(form.price),
      total_seats: Number(form.total_seats),
      available_seats: Number(form.total_seats),
      start_event: form.dateStart ? `${form.dateStart}T${form.timeStart || "00:00"}:00` : undefined,
      end_event: form.dateEnd ? `${form.dateEnd}T${form.timeEnd || "00:00"}:00` : undefined,
    };

    try {
      const url = editId ? `${API_BASE}/events/${editId}` : `${API_BASE}/events`;
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message ?? "Terjadi kesalahan");
      }
      setForm(emptyForm);
      setErrors({});
      setShowForm(false);
      setEditId(null);
      fetchEvents();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, banner: reader.result as string }));
    reader.readAsDataURL(file);
  }

  function handleEdit(ev: EventItem) {
    const startDate = ev.start_event ? ev.start_event.split("T")[0] : "";
    const endDate = ev.end_event ? ev.end_event.split("T")[0] : "";
    const startTime = ev.start_time
      ? new Date(ev.start_time).toTimeString().slice(0, 5)
      : ev.start_event
      ? new Date(ev.start_event).toTimeString().slice(0, 5)
      : "";
    const endTime = ev.end_time
      ? new Date(ev.end_time).toTimeString().slice(0, 5)
      : ev.end_event
      ? new Date(ev.end_event).toTimeString().slice(0, 5)
      : "";
    setForm({
      title: ev.title,
      location: ev.location ?? "",
      dateStart: startDate,
      dateEnd: endDate,
      timeStart: startTime,
      timeEnd: endTime,
      total_seats: String(ev.total_seats),
      price: ev.price,
      banner: ev.banner ?? "",
      description: ev.description ?? "",
      category: (ev.category as EventCategory) ?? "Konser",
      status: ev.status,
      organizer_id: "",
    });
    setEditId(ev.id);
    setErrors({});
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`${API_BASE}/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus event");
      fetchEvents();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    setErrors({});
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Manajemen Event</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola semua event yang tersedia</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(emptyForm); setEditId(null); setErrors({}); }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tambah Event
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-800">
                {editId !== null ? "Edit Event" : "Tambah Event Baru"}
              </h2>
              <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Banner */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Banner / Gambar Event</label>
                <div
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg p-3 flex flex-col items-center gap-2 cursor-pointer hover:border-orange-300 transition-colors"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {form.banner ? (
                    <img src={form.banner} alt="banner preview" className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-400">Klik untuk upload gambar (JPG, PNG)</p>
                    </>
                  )}
                  <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                </div>
                {form.banner && (
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, banner: "" }))} className="mt-1 text-xs text-red-400 hover:text-red-600">
                    Hapus gambar
                  </button>
                )}
              </div>

              
              {/* Nama Event */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nama Event</label>
                <input
                  name="title" value={form.title} onChange={handleChange}
                  placeholder="cth. Konser Malam Minggu"
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${errors.title ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lokasi</label>
                <input
                  name="location" value={form.location} onChange={handleChange}
                  placeholder="cth. Jakarta Convention Center"
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${errors.location ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
              </div>

              {/* Tanggal Mulai & Berakhir */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Mulai</label>
                  <input
                    type="date" name="dateStart" value={form.dateStart} onChange={handleChange}
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${errors.dateStart ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.dateStart && <p className="text-xs text-red-500 mt-1">{errors.dateStart}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Berakhir</label>
                  <input
                    type="date" name="dateEnd" value={form.dateEnd} onChange={handleChange}
                    min={form.dateStart || undefined}
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${errors.dateEnd ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.dateEnd && <p className="text-xs text-red-500 mt-1">{errors.dateEnd}</p>}
                </div>
              </div>

              {/* Waktu Mulai & Selesai */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Waktu Mulai</label>
                  <input
                    type="time" name="timeStart" value={form.timeStart} onChange={handleChange}
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${errors.timeStart ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.timeStart && <p className="text-xs text-red-500 mt-1">{errors.timeStart}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Waktu Selesai</label>
                  <input
                    type="time" name="timeEnd" value={form.timeEnd} onChange={handleChange}
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${errors.timeEnd ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.timeEnd && <p className="text-xs text-red-500 mt-1">{errors.timeEnd}</p>}
                </div>
              </div>

              {/* Kapasitas & Harga */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kapasitas Venue</label>
                  <input
                    type="number" name="total_seats" value={form.total_seats} onChange={handleChange} min={1}
                    placeholder="cth. 5000"
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${errors.total_seats ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.total_seats && <p className="text-xs text-red-500 mt-1">{errors.total_seats}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Harga (Rp)</label>
                  <input
                    type="number" name="price" value={form.price} onChange={handleChange} min={0}
                    placeholder="cth. 150000"
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${errors.price ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                </div>
              </div>

              {/* Kategori & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
                  <select name="category" value={form.category} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400">
                    {STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
                  </select>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi</label>
                <textarea
                  name="description" value={form.description} onChange={handleChange} rows={3}
                  placeholder="Deskripsi singkat tentang event..."
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none ${errors.description ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={handleCloseForm} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors">
                  {editId !== null ? "Simpan Perubahan" : "Simpan Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari event atau lokasi..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as EventCategory | "Semua")}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="Semua">Semua Kategori</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as EventStatus | "Semua")}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="Semua">Semua Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{events.length} event ditemukan</span>
      </div>

      {/* Event List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lokasi</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal & Waktu</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kapasitas</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">Memuat data...</td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                  Tidak ada event yang ditemukan.
                </td>
              </tr>
            ) : (
              events.map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {ev.banner ? (
                        <img src={ev.banner} alt={ev.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{ev.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{ev.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{ev.location ?? "-"}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {ev.start_event ? (
                      <p>
                        {new Date(ev.start_event).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        {ev.end_event && ev.end_event !== ev.start_event && (
                          <> - {new Date(ev.end_event).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</>
                        )}
                      </p>
                    ) : "-"}
                    {ev.start_event && ev.end_event && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(ev.start_event).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(ev.end_event).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {ev.total_seats > 0 ? ev.total_seats.toLocaleString("id-ID") : "-"}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {Number(ev.price) === 0
                      ? "Gratis"
                      : `Rp ${Number(ev.price).toLocaleString("id-ID")}`}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[ev.status]}`}>
                      {statusLabel[ev.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(ev)}
                        className="text-gray-400 hover:text-orange-500 transition-colors"
                        title="Edit event"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Hapus event"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

