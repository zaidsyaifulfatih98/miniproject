
import { useState, useRef } from "react";

type EventStatus = "Aktif" | "Selesai" | "Draft";
type EventCategory = "Konser" | "Workshop" | "Seminar" | "Festival" | "Olahraga" | "Lainnya";

interface EventItem {
  id: number;
  name: string;
  location: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  capacity: number;
  banner: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
}

const CATEGORIES: EventCategory[] = ["Konser", "Workshop", "Seminar", "Festival", "Olahraga", "Lainnya"];
const STATUSES: EventStatus[] = ["Aktif", "Selesai", "Draft"];

const initialEvents: EventItem[] = [
  { id: 1, name: "Konser Malam Minggu", location: "Jakarta Convention Center", date: "2026-04-20", timeStart: "19:00", timeEnd: "23:00", capacity: 5000, banner: "", description: "Konser musik pop bersama artis ternama.", category: "Konser", status: "Aktif" },
  { id: 2, name: "Workshop UI/UX Design", location: "Bandung Creative Hub", date: "2026-05-10", timeStart: "09:00", timeEnd: "17:00", capacity: 150, banner: "", description: "Workshop desain antarmuka untuk pemula hingga menengah.", category: "Workshop", status: "Aktif" },
  { id: 3, name: "Seminar Kewirausahaan", location: "Surabaya Grand Ballroom", date: "2026-03-15", timeStart: "08:00", timeEnd: "16:00", capacity: 300, banner: "", description: "Seminar membangun bisnis dari nol bersama pakar ekonomi.", category: "Seminar", status: "Selesai" },
  { id: 4, name: "Festival Kuliner Nusantara", location: "Lapangan Monas, Jakarta", date: "2026-06-01", timeStart: "10:00", timeEnd: "22:00", capacity: 10000, banner: "", description: "Festival makanan dari berbagai penjuru Indonesia.", category: "Festival", status: "Draft" },
  { id: 5, name: "Lari Maraton Kota", location: "Bundaran HI, Jakarta", date: "2026-07-17", timeStart: "05:00", timeEnd: "12:00", capacity: 3000, banner: "", description: "Maraton tahunan tingkat nasional.", category: "Olahraga", status: "Draft" },
];

const statusColor: Record<EventStatus, string> = {
  Aktif: "bg-green-100 text-green-700",
  Selesai: "bg-gray-100 text-gray-600",
  Draft: "bg-yellow-100 text-yellow-700",
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
  name: "",
  location: "",
  date: "",
  timeStart: "",
  timeEnd: "",
  capacity: "",
  banner: "",
  description: "",
  category: "Konser" as EventCategory,
  status: "Draft" as EventStatus,
};

export default function Event() {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof emptyForm, string>>>({});
  const [filterCategory, setFilterCategory] = useState<EventCategory | "Semua">("Semua");
  const [filterStatus, setFilterStatus] = useState<EventStatus | "Semua">("Semua");
  const [search, setSearch] = useState("");
  const bannerInputRef = useRef<HTMLInputElement>(null);

  function validate() {
    const e: Partial<Record<keyof typeof emptyForm, string>> = {};
    if (!form.name.trim()) e.name = "Nama event wajib diisi.";
    if (!form.location.trim()) e.location = "Lokasi wajib diisi.";
    if (!form.date) e.date = "Tanggal wajib diisi.";
    if (!form.timeStart) e.timeStart = "Waktu mulai wajib diisi.";
    if (!form.timeEnd) e.timeEnd = "Waktu selesai wajib diisi.";
    if (form.timeStart && form.timeEnd && form.timeEnd <= form.timeStart)
      e.timeEnd = "Waktu selesai harus setelah waktu mulai.";
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) <= 0)
      e.capacity = "Kapasitas venue harus lebih dari 0.";
    if (!form.description.trim()) e.description = "Deskripsi wajib diisi.";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const eventData: EventItem = {
      ...form,
      id: editId ?? (events.length ? Math.max(...events.map((x) => x.id)) + 1 : 1),
      capacity: Number(form.capacity),
    };
    if (editId !== null) {
      setEvents((prev) => prev.map((ev) => (ev.id === editId ? eventData : ev)));
    } else {
      setEvents((prev) => [eventData, ...prev]);
    }
    setForm(emptyForm);
    setErrors({});
    setShowForm(false);
    setEditId(null);
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

  function handleEdit(id: number) {
    const ev = events.find((x) => x.id === id);
    if (!ev) return;
    setForm({
      name: ev.name,
      location: ev.location,
      date: ev.date,
      timeStart: ev.timeStart,
      timeEnd: ev.timeEnd,
      capacity: String(ev.capacity),
      banner: ev.banner,
      description: ev.description,
      category: ev.category,
      status: ev.status,
    });
    setEditId(id);
    setErrors({});
    setShowForm(true);
  }

  function handleDelete(id: number) {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    setErrors({});
  }

  const filtered = events.filter((ev) => {
    const matchCat = filterCategory === "Semua" || ev.category === filterCategory;
    const matchStatus = filterStatus === "Semua" || ev.status === filterStatus;
    const matchSearch = ev.name.toLowerCase().includes(search.toLowerCase()) ||
      ev.location.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchStatus && matchSearch;
  });

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
                  name="name" value={form.name} onChange={handleChange}
                  placeholder="cth. Konser Malam Minggu"
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${errors.name ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
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

              {/* Tanggal & Kapasitas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal</label>
                  <input
                    type="date" name="date" value={form.date} onChange={handleChange}
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${errors.date ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kapasitas Venue</label>
                  <input
                    type="number" name="capacity" value={form.capacity} onChange={handleChange} min={1}
                    placeholder="cth. 5000"
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${errors.capacity ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}
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
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
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
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} event ditemukan</span>
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
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                  Tidak ada event yang ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {ev.banner ? (
                        <img src={ev.banner} alt={ev.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{ev.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{ev.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{ev.location}</td>
                  <td className="px-5 py-4 text-gray-600">
                    <p>{new Date(ev.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                    {ev.timeStart && ev.timeEnd && (
                      <p className="text-xs text-gray-400 mt-0.5">{ev.timeStart} – {ev.timeEnd}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {ev.capacity > 0 ? ev.capacity.toLocaleString("id-ID") : "-"}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColor[ev.category]}`}>
                      {ev.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[ev.status]}`}>
                      {ev.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(ev.id)}
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
