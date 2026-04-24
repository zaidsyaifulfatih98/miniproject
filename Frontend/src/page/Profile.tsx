import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User, Ticket, FileText, Edit2, Save, X, Home, ArrowRight, RefreshCw, Star, Camera, Lock, Gift, Coins } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { loadAndRenderTicketTemplate } from "../templates/ticketRenderer";
import ReviewForm from "../components/ReviewForm";

const API_BASE = import.meta.env.VITE_API_BASE;

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  birth_date: string;
  gender: string;
  address: string;
  referral_code: string;
  role: string[];
  createdAt: string;
  profile_picture?: string;
  points?: number;
}

interface TicketItem {
  id: string;
  event_title: string;
  event_location?: string;
  event_date?: Date;
  purchase_date: string;
  ticket_code: string;
  ticket_type?: string;
  ticket_price?: number;
  quantity?: number;
  status: string;
  eventStartDate?: Date;
}

interface Transaction {
  id: string;
  amount: number;
  status: "success" | "pending" | "failed";
  event_title: string;
  purchase_date: string;
  payment_method: string;
  booking_status?: string;
}

type EditableDraft = Pick<UserProfile, "full_name" | "email" | "birth_date" | "gender" | "address">;
type TabType = "profile" | "tickets" | "transactions" | "points";

export default function CustomerProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = (searchParams.get("tab") as TabType) || "profile";
  const [activeTab, setActiveTab] = useState<TabType>(tabParam);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EditableDraft>({
    full_name: "",
    email: "",
    birth_date: "",
    gender: "",
    address: "",
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reviewModal, setReviewModal] = useState<{ ticketId: string; eventId: string } | null>(null);

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Change password
  const [pwdModal, setPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const [pwdError, setPwdError] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState("");

  // Points
  const [availablePoints, setAvailablePoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    const { id } = JSON.parse(storedUser);

    axios
      .get(`${API_BASE}/users/${id}`)
      .then((res) => {
        const data: UserProfile = res.data.data;
        setProfile(data);
        setDraft({
          full_name: data.full_name,
          email: data.email,
          birth_date: data.birth_date ? data.birth_date.slice(0, 10) : "",
          gender: data.gender,
          address: data.address,
        });
        // fetch points
        return axios.get(`${API_BASE}/users/${id}/points-history`);
      })
      .then((res) => {
        if (res?.data?.data) {
          setAvailablePoints(res.data.data.available_points ?? 0);
          setPointsHistory(res.data.data.history ?? []);
        }
      })
      .catch(() => setError("Gagal memuat profil."))
      .finally(() => setLoading(false));
  }, [navigate]);

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        setError("User tidak ditemukan");
        return;
      }
      const { id: userId } = JSON.parse(storedUser);

      const response = await axios.get(`${API_BASE}/bookings?user_id=${userId}`, {
        withCredentials: true,
      });
      
      const bookingData = response.data.data || [];
      
      const ticketData = bookingData
        .filter((booking: any) => {
          const isDone = booking.status === "DONE";
          return isDone;
        })
        .map((booking: any) => {
          const eventStartDate = booking.event?.start_event ? new Date(booking.event.start_event) : null;
          const now = new Date();
          const isActive = eventStartDate ? eventStartDate > now : true;
          
          return {
            id: booking.id,
            event_title: booking.event?.title || "Unknown Event",
            event_location: booking.event?.location || "-",
            event_date: eventStartDate,
            purchase_date: booking.createdAt,
            ticket_code: booking.display_id || booking.id.slice(0, 8).toUpperCase(),
            ticket_type: booking.ticket?.type || "General",
            ticket_price: booking.ticket?.price || 0,
            quantity: booking.quantity || 1,
            status: isActive ? "active" : "inactive",
            eventStartDate: eventStartDate,
          };
        });
      
      setTickets(ticketData);
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setTicketsLoading(false);
    }
  };

  const loadTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        setError("User tidak ditemukan");
        return;
      }
      const { id: userId } = JSON.parse(storedUser);

      const url = `${API_BASE}/bookings?user_id=${userId}`;
      
      const response = await axios.get(url, {
        withCredentials: true,
      });
      
      const bookingData = response.data.data || [];
      
      if (!Array.isArray(bookingData)) {
        console.error("[loadTransactions] ERROR: bookingData is not an array:", typeof bookingData);
        setTransactions([]);
        return;
      }

      if (bookingData.length === 0) {
        console.log("[loadTransactions] No bookings found for user");
        setTransactions([]);
        return;
      }
      
      const transactionData = bookingData.map((booking: any) => {
        let status: "success" | "pending" | "failed" = "failed";
        if (booking.status === "DONE") {
          status = "success";
        } else if (booking.status === "PENDING" || booking.status === "WAITING_FOR_PAYMENTS" || booking.status === "WAITING_FOR_CONFIRMATION") {
          status = "pending";
        }
        
        return {
          id: booking.id,
          amount: parseFloat(booking.final_price || booking.total_price || 0),
          status,
          event_title: booking.event?.title || "Unknown Event",
          purchase_date: booking.createdAt,
          payment_method: "Bank Transfer",
          booking_status: booking.status,
        };
      });
      
      setTransactions(transactionData);
    } catch (err: any) {
      console.error("[loadTransactions] Error:", err);
      console.error("[loadTransactions] Error response:", err.response?.data);
      console.error("[loadTransactions] Error message:", err.message);
      setError(`Gagal memuat transaksi: ${err.response?.data?.message || err.message}`);
    } finally {
      setTransactionsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefreshTransactions = async () => {
    setIsRefreshing(true);
    await loadTransactions();
  };

  const handleRefreshTickets = async () => {
    setIsRefreshing(true);
    await loadTickets();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await axios.post(`${API_BASE}/users/${profile.id}/avatar`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newPicture = res.data.data.profile_picture;
      setProfile((prev) => prev ? { ...prev, profile_picture: newPicture } : prev);
      // Sync to localStorage so Navbar reflects the change
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem("user", JSON.stringify({ ...parsed, profile_picture: newPicture }));
        window.dispatchEvent(new Event("storage"));
      }
    } catch {
      setError("Gagal mengunggah foto.");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleChangePassword = async () => {
    if (pwdForm.next !== pwdForm.confirm) { setPwdError("Password baru tidak cocok"); return; }
    if (pwdForm.next.length < 6) { setPwdError("Password baru minimal 6 karakter"); return; }
    setPwdSaving(true); setPwdError(""); setPwdSuccess("");
    try {
      await axios.post(
        `${API_BASE}/users/${profile?.id}/change-password`,
        { currentPassword: pwdForm.current, newPassword: pwdForm.next },
        { withCredentials: true }
      );
      setPwdSuccess("Password berhasil diubah!");
      setPwdForm({ current: "", next: "", confirm: "" });
      setTimeout(() => { setPwdModal(false); setPwdSuccess(""); }, 1500);
    } catch (err: any) {
      setPwdError(err.response?.data?.message || "Gagal mengubah password");
    } finally {
      setPwdSaving(false);
    }
  };

  const loadPointsData = async () => {
    if (!profile) return;
    setPointsLoading(true);
    try {
      const [phRes, cpRes] = await Promise.all([
        axios.get(`${API_BASE}/users/${profile.id}/points-history`),
        axios.get(`${API_BASE}/users/${profile.id}/coupons`),
      ]);
      setAvailablePoints(phRes.data.data.available_points ?? 0);
      setPointsHistory(phRes.data.data.history ?? []);
      setCoupons(cpRes.data.data ?? []);
    } catch {
      /* silent */
    } finally {
      setPointsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tickets") {
      loadTickets();
    } else if (activeTab === "transactions") {
      loadTransactions();
    } else if (activeTab === "points") {
      loadPointsData();
    }
  }, [activeTab]);

  const handleEdit = () => {
    if (!profile) return;
    setDraft({
      full_name: profile.full_name,
      email: profile.email,
      birth_date: profile.birth_date ? profile.birth_date.slice(0, 10) : "",
      gender: profile.gender,
      address: profile.address,
    });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await axios.put(`${API_BASE}/users/${profile.id}`, {
        ...draft,
        birth_date: new Date(draft.birth_date).toISOString(),
      });
      setProfile((prev) => (prev ? { ...prev, ...res.data.data } : prev));
      setEditing(false);
    } catch {
      setError("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof EditableDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleCopy = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleSaveTicket = async (ticket: TicketItem) => {
    let container: HTMLElement | null = null;
    try {
      const htmlContent = await loadAndRenderTicketTemplate({
        ticket_code: ticket.ticket_code,
        event_title: ticket.event_title,
        event_location: ticket.event_location,
        eventStartDate: ticket.eventStartDate,
        purchase_date: ticket.purchase_date,
        ticket_type: ticket.ticket_type,
        ticket_price: ticket.ticket_price,
        status: ticket.status,
        id: ticket.id,
      });

      container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '800px';
      container.style.backgroundColor = 'white';
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgData = canvas.toDataURL('image/png');

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Tiket_${ticket.ticket_code}_${new Date().getTime()}.pdf`);

      await navigator.clipboard.writeText(ticket.ticket_code);

      setError(`✓ Tiket berhasil disimpan! Kode '${ticket.ticket_code}' sudah dicopy ke clipboard.`);
      setTimeout(() => setError(''), 3500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[handleSaveTicket] Error:', errorMsg);
      setError(`Gagal: ${errorMsg}`);
      setTimeout(() => setError(''), 4000);
    } finally {
      if (container && container.parentNode) {
        document.body.removeChild(container);
      }
    }
  };

  const avatarInitials = profile
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "??";

  const joinDate = profile
    ? new Date(profile.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold mb-4">{error || "Profil tidak ditemukan."}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Kembali ke Home
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profil Saya", icon: <User className="w-5 h-5" /> },
    { id: "tickets", label: "Tiket Saya", icon: <Ticket className="w-5 h-5" /> },
    { id: "transactions", label: "Riwayat Transaksi", icon: <FileText className="w-5 h-5" /> },
    { id: "points", label: "Poin & Voucher", icon: <Gift className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Akun Saya</h1>
              <p className="text-sm text-gray-600 mt-1">Kelola profil, tiket, dan riwayat transaksi Anda</p>
            </div>
            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">Home</span>
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-semibold border-b-2 transition ${
                  activeTab === tab.id
                    ? "text-orange-600 border-orange-500"
                    : "text-gray-600 border-transparent hover:text-orange-600"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Avatar Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
                {/* Avatar with upload */}
                <div className="relative mb-4">
                  {profile.profile_picture ? (
                    <img
                      src={profile.profile_picture}
                      alt={profile.full_name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-orange-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl font-bold text-white">
                      {avatarInitials}
                    </div>
                  )}
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute bottom-0 right-0 bg-white border-2 border-orange-300 rounded-full p-1.5 hover:bg-orange-50 transition shadow"
                    title="Ganti foto profil"
                  >
                    {avatarUploading ? (
                      <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-orange-500" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{profile.full_name}</h2>
                <p className="text-sm text-gray-600 mt-1">{profile.email}</p>
                <div className="flex gap-2 flex-wrap justify-center mt-4">
                  {profile.role.map((r) => (
                    <span key={r} className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                      {r === "ORGANIZER" ? "Organizer" : "Customer"}
                    </span>
                  ))}
                </div>
                {/* Points */}
                <div className="w-full mt-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-3">
                  <div className="flex items-center justify-center gap-2">
                    <Coins className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Poin Aktif</span>
                  </div>
                  <p className="text-2xl font-extrabold text-orange-600 mt-1">{availablePoints.toLocaleString("id-ID")}</p>
                </div>
                <div className="w-full border-t border-gray-200 mt-4 pt-4 text-center">
                  <p className="text-xs text-gray-500">Bergabung sejak</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1">{joinDate}</p>
                </div>
                <div className="w-full border-t border-gray-200 mt-4 pt-4">
                  <p className="text-xs text-gray-500 mb-2">Kode Referral</p>
                  <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-lg p-2">
                    <span className="font-mono font-bold text-sm text-gray-800">{profile.referral_code}</span>
                    <button onClick={handleCopy} className="p-1 hover:bg-gray-200 rounded transition" title="Salin kode referral">
                      {copied ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Informasi Profil</h3>
                    <p className="text-sm text-gray-600 mt-1">Ubah data pribadi akun Anda</p>
                  </div>
                  {!editing ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPwdModal(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition font-semibold text-sm"
                      >
                        <Lock className="w-4 h-4" />
                        Ubah Password
                      </button>
                      <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-semibold text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm"
                      >
                        <X className="w-4 h-4" />
                        Batal
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold text-sm disabled:opacity-60"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? "Menyimpan..." : "Simpan"}
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { key: "full_name", label: "Nama Lengkap" },
                    { key: "email", label: "Email", type: "email" },
                    { key: "birth_date", label: "Tanggal Lahir", type: "date" },
                    { key: "gender", label: "Jenis Kelamin" },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        {label}
                      </label>
                      {editing ? (
                        key === "gender" ? (
                          <select
                            value={draft[key as keyof EditableDraft]}
                            onChange={(e) => handleChange(key as keyof EditableDraft, e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                          >
                            <option value="">Pilih jenis kelamin</option>
                            <option value="Male">Laki-laki</option>
                            <option value="Female">Perempuan</option>
                          </select>
                        ) : (
                          <input
                            type={type || "text"}
                            value={draft[key as keyof EditableDraft]}
                            onChange={(e) => handleChange(key as keyof EditableDraft, e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                          />
                        )
                      ) : (
                        <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                          {key === "birth_date" && profile[key as keyof UserProfile]
                            ? new Date(profile[key as keyof UserProfile] as string).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : profile[key as keyof UserProfile] || "-"}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Alamat
                    </label>
                    {editing ? (
                      <textarea
                        value={draft.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition resize-none"
                      />
                    ) : (
                      <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 min-h-[80px] flex items-start pt-3">
                        {profile.address || "-"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === "tickets" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Tiket Saya</h2>
              <button
                onClick={handleRefreshTickets}
                disabled={isRefreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
            {ticketsLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600">Memuat tiket...</p>
              </div>
            ) : tickets.length > 0 ? (
              <div className="grid gap-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className={`bg-white rounded-xl border-2 p-6 transition ${ticket.status === "inactive" ? "border-gray-200 opacity-60 bg-gray-50" : "border-orange-200 hover:shadow-lg"}`}>
                    {/* Header dengan Event Title dan Status */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold ${ticket.status === "inactive" ? "text-gray-500" : "text-gray-900"}`}>
                          {ticket.event_title}
                        </h3>
                        {ticket.event_location && (
                          <p className="text-sm text-gray-600 mt-1">📍 {ticket.event_location}</p>
                        )}
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ml-4 ${
                        ticket.status === "active" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-200 text-gray-600"
                      }`}>
                        {ticket.status === "active" ? "✓ Aktif" : "✗ Tidak Aktif"}
                      </span>
                    </div>

                    {/* Ticket Information Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 font-semibold mb-1">KODE TIKET</p>
                        <p className="font-mono font-bold text-orange-600 text-sm md:text-lg break-words">{ticket.ticket_code}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 font-semibold mb-1">JENIS TIKET</p>
                        <p className="font-semibold text-gray-900">{ticket.ticket_type}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 font-semibold mb-1">JUMLAH</p>
                        <p className="font-semibold text-gray-900">{ticket.quantity} tiket</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 font-semibold mb-1">HARGA/TIKET</p>
                        <p className="font-semibold text-gray-900">Rp{ticket.ticket_price?.toLocaleString("id-ID")}</p>
                      </div>
                    </div>

                    {/* Event & Purchase Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">📅 TANGGAL ACARA</p>
                        {ticket.eventStartDate ? (
                          <p className="text-sm text-gray-900 font-medium">
                            {new Date(ticket.eventStartDate).toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">-</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">🛒 TANGGAL PEMBELIAN</p>
                        <p className="text-sm text-gray-900 font-medium">
                          {new Date(ticket.purchase_date).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-xs font-semibold text-blue-900 mb-2">📋 CARA PENGGUNAAN:</p>
                      <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                        <li>Tunjukkan kode tiket <span className="font-mono font-bold">{ticket.ticket_code}</span> saat check-in</li>
                        <li>Bisa ditunjukkan via screenshot atau print</li>
                        <li>Pastikan hadir 15 menit sebelum acara dimulai</li>
                        <li>Siapkan identitas diri asli saat check-in</li>
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <button
                        onClick={() => setReviewModal({ ticketId: ticket.id, eventId: ticket.id })}
                        className="w-full px-4 py-3 bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        title="Berikan rating dan ulasan untuk event ini"
                      >
                        <Star size={18} />
                        Beri Rating
                      </button>
                      {ticket.status === "active" && (
                        <button
                          onClick={() => handleSaveTicket(ticket)}
                          className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                          title="Download dan simpan tiket digital ke perangkat Anda"
                          aria-label="Simpan tiket digital"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Simpan Tiket
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Belum ada tiket</p>
                <p className="text-sm text-gray-500 mt-1">Pesan event untuk mendapatkan tiket</p>
              </div>
            )}
          </div>
        )}

        {/* Review Modal */}
        {reviewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
            <div className="bg-white w-full sm:w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
                <h3 className="text-lg font-bold text-gray-900">Beri Rating & Ulasan</h3>
                <button
                  onClick={() => setReviewModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
              <div className="p-6">
                <ReviewForm
                  eventId={reviewModal.eventId}
                  bookingId={reviewModal.ticketId}
                  onReviewSubmitted={() => {
                    setReviewModal(null);
                    handleRefreshTickets(); // Refresh tickets to update review status
                  }}
                  onClose={() => setReviewModal(null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h2>
              <button
                onClick={handleRefreshTransactions}
                disabled={isRefreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
            {transactionsLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600">Memuat transaksi...</p>
              </div>
            ) : transactions.length > 0 ? (
              <div className="grid gap-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{transaction.event_title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Metode: <span className="font-medium">{transaction.payment_method}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(transaction.purchase_date).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600">
                            Rp{transaction.amount.toLocaleString("id-ID")}
                          </p>
                          <span
                            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                              transaction.status === "success"
                                ? "bg-green-100 text-green-700"
                                : transaction.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {transaction.status === "success"
                              ? "Berhasil"
                              : transaction.status === "pending"
                                ? "Menunggu"
                                : "Gagal"}
                          </span>
                        </div>
                        {transaction.status === "pending" && (
                          <button
                            onClick={() => navigate(`/payment/${transaction.id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition text-sm font-semibold"
                          >
                            <span>Lanjutkan</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                        {transaction.status === "success" && (
                          <button
                            onClick={() => navigate(`/payment/${transaction.id}`)}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition text-xs font-semibold"
                          >
                            Lihat Detail
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Belum ada transaksi</p>
                <p className="text-sm text-gray-500 mt-1">Transaksi Anda akan muncul di sini</p>
                {error && (
                  <p className="text-sm text-red-600 mt-3 px-4">
                    <span className="font-semibold">Error:</span> {error}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Points Tab */}
        {activeTab === "points" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-6 text-white">
              <p className="text-sm font-semibold opacity-80 uppercase tracking-wide">Poin Aktif</p>
              <p className="text-4xl font-extrabold mt-1">{availablePoints.toLocaleString("id-ID")}</p>
              <p className="text-xs opacity-70 mt-1">Poin yang dapat digunakan untuk diskon pembelian tiket</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Riwayat Poin</h3>
              {pointsLoading ? (
                <div className="text-center py-8 text-gray-400">Memuat...</div>
              ) : pointsHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Belum ada riwayat poin</div>
              ) : (
                <div className="space-y-3">
                  {pointsHistory.map((h: any) => {
                    const expired = new Date(h.expires_at) < new Date() || h.deletedAt;
                    return (
                      <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">+{h.points.toLocaleString("id-ID")} poin</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Berlaku hingga:{" "}
                            {new Date(h.expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${expired ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
                          {expired ? "Kadaluarsa" : "Aktif"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Voucher Saya</h3>
              {coupons.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Belum ada voucher</div>
              ) : (
                <div className="space-y-3">
                  {coupons.map((c: any) => {
                    const expired = new Date(c.expires_at) < new Date();
                    const used = c.used_count >= c.max_usage;
                    return (
                      <div key={c.id} className={`p-4 rounded-xl border-2 ${expired || used ? "border-gray-200 opacity-60" : "border-orange-200 bg-orange-50"}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-sm text-gray-900">{c.name}</p>
                            <p className="font-mono text-lg font-extrabold text-orange-600 mt-1">{c.promotion_code}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Diskon {c.discount_amount}% • Berlaku hingga {new Date(c.expires_at).toLocaleDateString("id-ID")}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${expired ? "bg-gray-100 text-gray-500" : used ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                            {expired ? "Kadaluarsa" : used ? "Terpakai" : "Aktif"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {pwdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-500" /> Ubah Password
              </h3>
              <button
                onClick={() => { setPwdModal(false); setPwdError(""); setPwdSuccess(""); setPwdForm({ current: "", next: "", confirm: "" }); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            {pwdSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{pwdSuccess}</div>
            )}
            {pwdError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{pwdError}</div>
            )}
            <div className="space-y-4">
              {[
                { key: "current", label: "Password Lama" },
                { key: "next", label: "Password Baru" },
                { key: "confirm", label: "Konfirmasi Password Baru" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">{label}</label>
                  <input
                    type="password"
                    value={pwdForm[key as keyof typeof pwdForm]}
                    onChange={(e) => setPwdForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setPwdModal(false); setPwdError(""); setPwdForm({ current: "", next: "", confirm: "" }); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleChangePassword}
                disabled={pwdSaving}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-semibold text-sm disabled:opacity-60"
              >
                {pwdSaving ? "Menyimpan..." : "Simpan Password"}
              </button>
            </div>
            <div className="mt-4 text-center">
              <a href="/forgot-password" className="text-xs text-orange-500 hover:underline">Lupa password lama?</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
