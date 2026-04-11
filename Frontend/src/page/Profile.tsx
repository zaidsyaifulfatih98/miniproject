import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User, Ticket, FileText, Edit2, Save, X, Home } from "lucide-react";

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
}

interface TicketItem {
  id: string;
  event_title: string;
  purchase_date: string;
  ticket_code: string;
  status: string;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  event_title: string;
  purchase_date: string;
  payment_method: string;
}

type EditableDraft = Pick<UserProfile, "full_name" | "email" | "birth_date" | "gender" | "address">;
type TabType = "profile" | "tickets" | "transactions";

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

  // Load profile
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
      })
      .catch(() => setError("Gagal memuat profil."))
      .finally(() => setLoading(false));
  }, [navigate]);

  // Load tickets
  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/tickets`);
      setTickets(response.data.data || []);
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setTicketsLoading(false);
    }
  };

  // Load transactions
  const loadTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/payments`);
      setTransactions(response.data.data || []);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === "tickets" && tickets.length === 0) {
      loadTickets();
    } else if (activeTab === "transactions" && transactions.length === 0) {
      loadTransactions();
    }
  }, [activeTab, tickets.length, transactions.length]);

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
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100">
      {/* Header */}
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

      {/* Tabs */}
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
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl font-bold text-white mb-4">
                  {avatarInitials}
                </div>
                <h2 className="text-lg font-bold text-gray-900">{profile.full_name}</h2>
                <p className="text-sm text-gray-600 mt-1">{profile.email}</p>
                <div className="flex gap-2 flex-wrap justify-center mt-4">
                  {profile.role.map((r) => (
                    <span
                      key={r}
                      className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold"
                    >
                      {r === "ORGANIZER" ? "Organizer" : "Customer"}
                    </span>
                  ))}
                </div>
                <div className="w-full border-t border-gray-200 mt-4 pt-4 text-center">
                  <p className="text-xs text-gray-500">Bergabung sejak</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1">{joinDate}</p>
                </div>
                <div className="w-full border-t border-gray-200 mt-4 pt-4">
                  <p className="text-xs text-gray-500 mb-2">Kode Referral</p>
                  <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-lg p-2">
                    <span className="font-mono font-bold text-sm text-gray-800">{profile.referral_code}</span>
                    <button
                      onClick={handleCopy}
                      className="p-1 hover:bg-gray-200 rounded transition"
                      title="Salin kode referral"
                    >
                      {copied ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
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
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-semibold text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tiket Saya</h2>
            {ticketsLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600">Memuat tiket...</p>
              </div>
            ) : tickets.length > 0 ? (
              <div className="grid gap-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{ticket.event_title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Kode Tiket: <span className="font-mono font-bold text-orange-600">{ticket.ticket_code}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Dibeli: {new Date(ticket.purchase_date).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ticket.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {ticket.status === "active" ? "Aktif" : "Tidak Aktif"}
                      </span>
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

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Riwayat Transaksi</h2>
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
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Belum ada transaksi</p>
                <p className="text-sm text-gray-500 mt-1">Transaksi Anda akan muncul di sini</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
