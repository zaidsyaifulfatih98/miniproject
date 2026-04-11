import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

interface FormData {
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalSeats: number;
  price: number;
  category: string;
  status: string;
  description: string;
  image: File | null;
}

interface FormErrors {
  [key: string]: string;
}

interface Toast {
  message: string;
  type: "success" | "error" | "info";
}

const CATEGORIES = [
  { value: "KONSER", label: "Konser" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "SEMINAR", label: "Seminar" },
  { value: "FESTIVAL", label: "Festival" },
  { value: "OLAHRAGA", label: "Olahraga" },
  { value: "LAINNYA", label: "Lainnya" },
];

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "REJECTED", label: "Rejected" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<FormData>({
    title: "",
    location: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    totalSeats: 0,
    price: 0,
    category: "LAINNYA",
    status: "DRAFT",
    description: "",
    image: null,
  });

  // Check authentication and role
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
          navigate("/login");
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (!parsedUser.role?.includes("ORGANIZER")) {
          navigate("/register");
          return;
        }

        setLoading(false);
      } catch (error) {
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim() || formData.title.length < 5) {
      newErrors.title = "Judul event minimal 5 karakter";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Lokasi harus diisi";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Tanggal mulai harus diisi";
    }
    if (!formData.endDate) {
      newErrors.endDate = "Tanggal berakhir harus diisi";
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = "Tanggal berakhir harus setelah tanggal mulai";
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = "Waktu mulai harus diisi";
    }
    if (!formData.endTime) {
      newErrors.endTime = "Waktu berakhir harus diisi";
    }

    if (!formData.totalSeats || formData.totalSeats <= 0) {
      newErrors.totalSeats = "Kapasitas venue harus lebih dari 0";
    }

    if (formData.price < 0) {
      newErrors.price = "Harga tidak boleh negatif";
    }
    if (formData.price > 0 && formData.price < 10000) {
      newErrors.price = "Harga minimal Rp 10.000";
    }

    if (!formData.description.trim() || formData.description.length < 20) {
      newErrors.description = "Deskripsi minimal 20 karakter";
    }

    if (!formData.image) {
      newErrors.image = "Gambar event harus diunggah";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Show toast
  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Ukuran gambar maksimal 2MB" }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "File harus berupa gambar (JPG, PNG)" }));
      return;
    }

    setFormData((prev) => ({ ...prev, image: file }));
    setErrors((prev) => ({ ...prev, image: "" }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormData;

    if (fieldName === "totalSeats" || fieldName === "price") {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value ? parseInt(value) || parseFloat(value) : 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    }

    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Mohon perbaiki form terlebih dahulu", "error");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("start_event", formData.startDate);
      formDataToSend.append("end_event", formData.endDate);
      formDataToSend.append("start_time", formData.startTime);
      formDataToSend.append("end_time", formData.endTime);
      formDataToSend.append("total_seats", formData.totalSeats.toString());
      formDataToSend.append("available_seats", formData.totalSeats.toString());
      formDataToSend.append("price", formData.price.toString());
      formDataToSend.append("category", formData.category);
      formDataToSend.append("status", formData.status);
      formDataToSend.append("description", formData.description);

      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      const response = await axios.post(`${API_BASE}/events/create`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        showToast("Event berhasil dibuat!", "success");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        showToast(response.data.message || "Gagal membuat event", "error");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Terjadi kesalahan saat membuat event";
      showToast(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-4 rounded-lg text-white z-50 flex items-center gap-3 ${
            toast.type === "success"
              ? "bg-green-500"
              : toast.type === "error"
              ? "bg-red-500"
              : "bg-blue-500"
          }`}
        >
          {toast.type === "success" && <CheckCircle size={20} />}
          {toast.type === "error" && <AlertCircle size={20} />}
          {toast.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Buat Event Baru</h1>
          <p className="text-gray-600">Isi informasi event Anda untuk mulai menerima pemesanan tiket</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 sm:p-12">
            {/* Image Upload */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Gambar Event
              </label>
              <div className="relative">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-80 object-cover rounded-2xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData((prev) => ({ ...prev, image: null }));
                      }}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition cursor-pointer shadow-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-orange-300 rounded-2xl p-12 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all bg-white block min-h-80 flex flex-col items-center justify-center">
                    <Upload className="mx-auto mb-4 text-orange-500" size={48} />
                    <p className="text-gray-900 font-semibold text-lg mb-2">Klik untuk upload gambar</p>
                    <p className="text-sm text-gray-500">JPG atau PNG, maksimal 2MB</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {errors.image && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle size={16} />
                  {errors.image}
                </p>
              )}
            </div>

            {/* Basic Info Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Informasi Dasar</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Event
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Contoh: Konser Malam Minggu"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.title
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-orange-200"
                  }`}
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lokasi
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Contoh: Jakarta Convention Center"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.location
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-orange-200"
                  }`}
                />
                {errors.location && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.location}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 transition"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 transition"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.startDate
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-orange-200"
                    }`}
                  />
                  {errors.startDate && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={16} />
                      {errors.startDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Berakhir
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.endDate
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-orange-200"
                    }`}
                  />
                  {errors.endDate && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={16} />
                      {errors.endDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waktu Mulai
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.startTime
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-orange-200"
                    }`}
                  />
                  {errors.startTime && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={16} />
                      {errors.startTime}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waktu Berakhir
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.endTime
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-orange-200"
                    }`}
                  />
                  {errors.endTime && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={16} />
                      {errors.endTime}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Venue & Pricing */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Venue & Harga</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kapasitas Venue
                </label>
                <input
                  type="number"
                  name="totalSeats"
                  value={formData.totalSeats || ""}
                  onChange={handleInputChange}
                  placeholder="Contoh: 5000"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.totalSeats
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-orange-200"
                  }`}
                />
                {errors.totalSeats && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.totalSeats}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga Tiket (Rp)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price || ""}
                  onChange={handleInputChange}
                  placeholder="Contoh: 150000 (atau 0 untuk gratis)"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.price
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-orange-200"
                  }`}
                />
                {errors.price && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.price}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Masukkan 0 untuk event gratis
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Deskripsi Event</h2>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Lengkap
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Jelaskan detail event Anda, termasuk topik yang akan dibahas, pembicara, fasilitas, dll..."
                rows={8}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition resize-none ${
                  errors.description
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:ring-orange-200"
                }`}
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={16} />
                  {errors.description}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                Minimal 20 karakter • Jelaskan dengan detail untuk menarik pembeli tiket
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
              >
                {submitting ? "Membuat Event..." : "Buat Event"}
              </button>
            </div>
          </form>
        </div>

        {/* Helper Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tips Membuat Event yang Sukses:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Gunakan judul yang menarik dan deskriptif</li>
            <li>Sertakan gambar berkualitas tinggi yang mewakili event Anda</li>
            <li>Berikan deskripsi detail tentang acara, pembicara, dan fasilitas</li>
            <li>Atur harga yang kompetitif untuk menarik pembeli tiket</li>
            <li>Pastikan semua informasi (tanggal, waktu, lokasi) sudah benar</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
