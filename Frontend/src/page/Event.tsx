
import { useState } from "react";

type EventStatus = "Aktif" | "Selesai" | "Draft";
type EventCategory = "Konser" | "Workshop" | "Seminar" | "Festival" | "Olahraga" | "Lainnya";

interface EventItem {
  id: number;
  name: string;
  location: string;
  date: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
}

const CATEGORIES: EventCategory[] = ["Konser", "Workshop", "Seminar", "Festival", "Olahraga", "Lainnya"];
const STATUSES: EventStatus[] = ["Aktif", "Selesai", "Draft"];

const initialEvents: EventItem[] = [
  { id: 1, name: "Konser Malam Minggu", location: "Jakarta Convention Center", date: "2026-04-20", description: "Konser musik pop bersama artis ternama.", category: "Konser", status: "Aktif" },
  { id: 2, name: "Workshop UI/UX Design", location: "Bandung Creative Hub", date: "2026-05-10", description: "Workshop desain antarmuka untuk pemula hingga menengah.", category: "Workshop", status: "Aktif" },
  { id: 3, name: "Seminar Kewirausahaan", location: "Surabaya Grand Ballroom", date: "2026-03-15", description: "Seminar membangun bisnis dari nol bersama pakar ekonomi.", category: "Seminar", status: "Selesai" },
  { id: 4, name: "Festival Kuliner Nusantara", location: "Lapangan Monas, Jakarta", date: "2026-06-01", description: "Festival makanan dari berbagai penjuru Indonesia.", category: "Festival", status: "Draft" },
  { id: 5, name: "Lari Maraton Kota", location: "Bundaran HI, Jakarta", date: "2026-07-17", description: "Maraton tahunan tingkat nasional.", category: "Olahraga", status: "Draft" },
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
  description: "",
  category: "Konser" as EventCategory,
  status: "Draft" as EventStatus,
};

export default function Event() {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({});
  const [filterCategory, setFilterCategory] = useState<EventCategory | "Semua">("Semua");
  const [filterStatus, setFilterStatus] = useState<EventStatus | "Semua">("Semua");
  const [search, setSearch] = useState("");

  function validate() {
    const e: Partial<typeof emptyForm> = {};
    if (!form.name.trim()) e.name = "Nama event wajib diisi.";
    if (!form.location.trim()) e.location = "Lokasi wajib diisi.";
    if (!form.date) e.date = "Tanggal wajib diisi.";
    if (!form.description.trim()) e.description = "Deskripsi wajib diisi.";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setEvents((prev) => [
      { ...form, id: prev.length ? Math.max(...prev.map((x) => x.id)) + 1 : 1 },
      ...prev,
    ]);
    setForm(emptyForm);
    setErrors({});
    setShowForm(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  function handleDelete(id: number) {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
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
          onClick={() => { setShowForm(true); setForm(emptyForm); setErrors({}); }}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-800">Tambah Event Baru</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nama Event</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="cth. Konser Malam Minggu"
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${errors.name ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lokasi</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="cth. Jakarta Convention Center"
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${errors.location ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${errors.date ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Deskripsi singkat tentang event..."
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none ${errors.description ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors">
                  Simpan Event
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
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  Tidak ada event yang ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-800">{ev.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{ev.description}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{ev.location}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {new Date(ev.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
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
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Hapus event"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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
