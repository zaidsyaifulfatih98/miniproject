import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, Search, AlertCircle, CheckCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE;

interface Promo {
  id: string;
  name: string;
  promotion_code: string;
  discount_amount: number;
  type: "VOUCHER" | "FLASH_SALE" | "BUNDLE" | "LAINNYA";
  max_usage: number | null;
  used_count: number | null;
  expires_at: string | null;
  event_id: string;
  event?: { id: string; title: string };
}

interface FormData {
  name: string;
  promotion_code: string;
  discount_amount: string;
  type: "VOUCHER" | "FLASH_SALE" | "BUNDLE" | "LAINNYA";
  max_usage: string;
  expires_at: string;
  event_id: string;
}

interface Event {
  id: string;
  title: string;
}

export default function OrganizerPromos() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const [formData, setFormData] = useState<FormData>({
    name: "",
    promotion_code: "",
    discount_amount: "",
    type: "VOUCHER",
    max_usage: "",
    expires_at: "",
    event_id: "",
  });

  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;

  useEffect(() => {
    loadPromos();
    loadEvents();
  }, []);

  const loadPromos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/promos`, {
        params: { organizer_id: user?.id },
      });
      setPromos(res.data.data || []);
    } catch (error) {
      showMessage("error", "Gagal memuat voucher");
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/events`, {
        params: { organizer_id: user?.id },
      });
      setEvents(res.data.data || []);
    } catch (error) {
      console.error("Gagal memuat events:", error);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    // Auto-uppercase
    if (name === "promotion_code") {
      value = value.toUpperCase();
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi
    if (
      !formData.name ||
      !formData.promotion_code ||
      !formData.discount_amount ||
      !formData.type ||
      !formData.event_id
    ) {
      showMessage("error", "Harap isi semua field yang diperlukan");
      return;
    }

    if (Number(formData.max_usage) < 1 && formData.max_usage) {
      showMessage("error", "Kuota minimal harus 1");
      return;
    }

    if (formData.expires_at) {
      const expiryDate = new Date(formData.expires_at);
      if (expiryDate < new Date()) {
        showMessage("error", "Tanggal kadaluarsa tidak boleh di masa lalu");
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name,
        promotion_code: formData.promotion_code,
        discount_amount: Number(formData.discount_amount),
        type: formData.type,
        max_usage: formData.max_usage ? Number(formData.max_usage) : null,
        expires_at: formData.expires_at || null,
        event_id: formData.event_id,
      };

      if (editingId) {
        await axios.put(`${API_BASE}/promos/${editingId}`, payload);
        showMessage("success", "Voucher berhasil diupdate");
      } else {
        await axios.post(`${API_BASE}/promos`, payload);
        showMessage("success", "Voucher berhasil dibuat");
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: "",
        promotion_code: "",
        discount_amount: "",
        type: "VOUCHER",
        max_usage: "",
        expires_at: "",
        event_id: "",
      });
      loadPromos();
    } catch (error: any) {
      showMessage("error", error.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promo: Promo) => {
    setFormData({
      name: promo.name,
      promotion_code: promo.promotion_code,
      discount_amount: String(promo.discount_amount),
      type: promo.type,
      max_usage: promo.max_usage ? String(promo.max_usage) : "",
      expires_at: promo.expires_at ? promo.expires_at.split("T")[0] : "",
      event_id: promo.event_id,
    });
    setEditingId(promo.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus voucher ini?")) return;

    try {
      await axios.delete(`${API_BASE}/promos/${id}`);
      showMessage("success", "Voucher berhasil dihapus");
      loadPromos();
    } catch (error) {
      showMessage("error", "Gagal menghapus voucher");
    }
  };

  const filteredPromos = promos.filter((promo) =>
    promo.promotion_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    promo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  };

  const getRemainingQuota = (promo: Promo) => {
    if (!promo.max_usage) return "Unlimited";
    return `${promo.used_count || 0}/${promo.max_usage}`;
  };

  const getEventTitle = (eventId: string) => {
    return events.find((e) => e.id === eventId)?.title || eventId;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manajemen Voucher & Promosi</h1>
              <p className="text-gray-600 mt-2">Buat dan kelola kode voucher untuk event Anda</p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                setFormData({
                  name: "",
                  promotion_code: "",
                  discount_amount: "",
                  type: "VOUCHER",
                  max_usage: "",
                  expires_at: "",
                  event_id: "",
                });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              <Plus className="w-5 h-5" />
              Buat Voucher
            </button>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`flex items-center gap-2 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {message.text}
            </div>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingId ? "Edit Voucher" : "Buat Voucher Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event * </label>
                <select
                  name="event_id"
                  value={formData.event_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Pilih Event...</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Voucher *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Misal: Diskon Member Baru"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kode Voucher *
                </label>
                <input
                  type="text"
                  name="promotion_code"
                  value={formData.promotion_code}
                  onChange={handleInputChange}
                  placeholder="PROMO2024 (auto UPPERCASE)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="VOUCHER">Voucher (Fixed Amount)</option>
                  <option value="FLASH_SALE">Flash Sale</option>
                  <option value="BUNDLE">Bundle</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nilai Diskon (Rp) *
                </label>
                <input
                  type="number"
                  name="discount_amount"
                  value={formData.discount_amount}
                  onChange={handleInputChange}
                  placeholder="Contoh: 50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kuota (Opsional)
                </label>
                <input
                  type="number"
                  name="max_usage"
                  value={formData.max_usage}
                  onChange={handleInputChange}
                  placeholder="Kosong = Unlimited"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Kadaluarsa (Opsional)
                </label>
                <input
                  type="date"
                  name="expires_at"
                  value={formData.expires_at}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
                >
                  {loading ? "Menyimpan..." : editingId ? "Update Voucher" : "Buat Voucher"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode atau nama voucher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading && promos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Memuat voucher...</div>
          ) : filteredPromos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {promos.length === 0
                ? "Belum ada voucher. Buat yang pertama!"
                : "Voucher tidak ditemukan"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Kode
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Event
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Nama
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Diskon
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Kuota
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Kadaluarsa
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPromos.map((promo) => (
                    <tr key={promo.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {promo.promotion_code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getEventTitle(promo.event_id)}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{promo.name}</td>
                      <td className="px-6 py-4 text-gray-700">
                        Rp {promo.discount_amount.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{getRemainingQuota(promo)}</td>
                      <td className="px-6 py-4 text-gray-700">
                        {promo.expires_at
                          ? new Date(promo.expires_at).toLocaleDateString("id-ID")
                          : "Permanent"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            isExpired(promo.expires_at)
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isExpired(promo.expires_at) ? "Expired" : "Aktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(promo)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(promo.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

