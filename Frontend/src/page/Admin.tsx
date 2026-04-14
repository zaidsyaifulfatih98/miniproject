
import { useEffect, useState } from "react";
import axios from "axios";

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
}

type EditableDraft = Pick<UserProfile, "full_name" | "email" | "birth_date" | "gender" | "address">;

export default function Admin() {
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

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
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
  }, []);

  function handleEdit() {
    if (!profile) return;
    setDraft({
      full_name: profile.full_name,
      email: profile.email,
      birth_date: profile.birth_date ? profile.birth_date.slice(0, 10) : "",
      gender: profile.gender,
      address: profile.address,
    });
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await axios.put(`${API_BASE}/users/${profile.id}`, {
        ...draft,
        birth_date: new Date(draft.birth_date).toISOString(),
      });
      setProfile((prev) => prev ? { ...prev, ...res.data.data } : prev);
      setEditing(false);
    } catch {
      setError("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: keyof EditableDraft, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function handleCopy() {
    if (!profile) return;
    navigator.clipboard.writeText(profile.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const avatarInitials = profile
    ? profile.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  const joinDate = profile
    ? new Date(profile.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Memuat profil...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500 text-sm">{error || "Profil tidak ditemukan."}</p>
      </div>
    );
  }

  const fields: { key: keyof EditableDraft; label: string; type?: string }[] = [
    { key: "full_name", label: "Nama Lengkap" },
    { key: "email", label: "Email", type: "email" },
    { key: "birth_date", label: "Tanggal Lahir", type: "date" },
    { key: "gender", label: "Jenis Kelamin" },
    { key: "address", label: "Alamat" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola informasi akun Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Col 1: Avatar card ── */}
        <div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-md">
              {avatarInitials}
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{profile.full_name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>
              <div className="flex gap-1.5 flex-wrap justify-center mt-2">
                {profile.role.map((r) => (
                  <span key={r} className="px-3 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                    {r === "ORGANIZER" ? "Organizer" : "Customer"}
                  </span>
                ))}
              </div>
            </div>
            <div className="w-full border-t border-gray-100 pt-4 text-center">
              <p className="text-xs text-gray-400">Bergabung sejak</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{joinDate}</p>
            </div>
            <div className="w-full border-t border-gray-100 pt-4">
              <div className="text-center">
                <p className="text-xs text-gray-400">Kode Referral</p>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="font-mono font-bold text-sm text-gray-800 tracking-wider">{profile.referral_code}</span>
                  <button onClick={handleCopy} title="Salin kode referral" className="text-gray-400 hover:text-indigo-500 transition-colors">
                    {copied ? (
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Col 2: Profile form ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-gray-800">Informasi Profil</h2>
                <p className="text-xs text-gray-500 mt-0.5">Data pribadi akun Anda</p>
              </div>
              {!editing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profil
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleCancel} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {fields.map(({ key, label, type }) => (
                <div key={key} className={key === "address" ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                  {editing ? (
                    key === "address" ? (
                      <textarea
                        rows={3}
                        value={draft[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none transition"
                      />
                    ) : key === "gender" ? (
                      <select
                        value={draft[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                      >
                        <option value="">Pilih jenis kelamin</option>
                        <option value="Male">Laki-laki</option>
                        <option value="Female">Perempuan</option>
                      </select>
                    ) : (
                      <input
                        type={type ?? "text"}
                        value={draft[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                      />
                    )
                  ) : (
                    <div className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 min-h-[46px]">
                      {key === "birth_date" && profile[key]
                        ? new Date(profile[key]).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                        : profile[key] || "-"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

