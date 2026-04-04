
import { useState } from "react";

interface UserProfile {
  fullname: string;
  email: string;
  phone: string;
  address: string;
  referralCode: string;
  points: number;
  avatar: string;
  joinDate: string;
}

const pointHistory = [
  { date: "2026-03-28", desc: "Pembelian tiket Java Jazz Festival", pts: +20000 },
  { date: "2026-03-20", desc: "Referral berhasil — Rina Kusuma", pts: +60000 },
  { date: "2026-03-15", desc: "Pembelian tiket Tech Summit 2026", pts: +120000 },
  { date: "2026-03-01", desc: "Pembelian tiket Startup Weekend", pts: +40000 },
  { date: "2026-02-10", desc: "Referral berhasil — Doni Setiawan", pts: +20000 },
];

const initialProfile: UserProfile = {
  fullname: "Budi Santoso",
  email: "budi.santoso@email.com",
  phone: "0812-3456-7890",
  address: "Jl. Sudirman No. 12, Jakarta Pusat, DKI Jakarta 10220",
  referralCode: "BUDI-X9K2",
  points: pointHistory.reduce((sum, item) => sum + item.pts, 0),
  avatar: "BS",
  joinDate: "15 Januari 2025",
};

export default function Admin() {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(initialProfile);
  const [copied, setCopied] = useState(false);

  function handleEdit() {
    setDraft(profile);
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
  }

  function handleSave() {
    setProfile(draft);
    setEditing(false);
  }

  function handleChange(field: keyof UserProfile, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function handleCopy() {
    navigator.clipboard.writeText(profile.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const fields: { key: keyof UserProfile; label: string; type?: string; readOnly?: boolean }[] = [
    { key: "fullname", label: "Nama Lengkap" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "No. Telepon", type: "tel" },
    { key: "address", label: "Alamat" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola informasi akun dan lihat poin Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Col 1: Avatar card ── */}
        <div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-md">
              {profile.avatar}
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{profile.fullname}</p>
              <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">Admin</span>
            </div>
            <div className="w-full border-t border-gray-100 pt-4 text-center">
              <p className="text-xs text-gray-400">Bergabung sejak</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{profile.joinDate}</p>
            </div>
            <div className="w-full border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Total Poin</p>
                  <p className="text-xl font-extrabold text-indigo-600 mt-0.5">{profile.points.toLocaleString("id-ID")}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Kode Referral</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-sm text-gray-800 tracking-wider">{profile.referralCode}</span>
                    <button
                      onClick={handleCopy}
                      title="Salin kode referral"
                      className="text-gray-400 hover:text-indigo-500 transition-colors"
                    >
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
        </div>

        {/* ── Col 2: Profile form + Riwayat Poin ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Profile form */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-gray-800">Informasi Profil</h2>
                <p className="text-xs text-gray-500 mt-0.5">Data pribadi dan kontak akun Anda</p>
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
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Simpan
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {fields.map(({ key, label, type }) => (
                <div key={key} className={key === "address" ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {label}
                  </label>
                  {editing ? (
                    key === "address" ? (
                      <textarea
                        rows={3}
                        value={draft[key] as string}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none transition"
                      />
                    ) : (
                      <input
                        type={type ?? "text"}
                        value={draft[key] as string}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                      />
                    )
                  ) : (
                    <div className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 min-h-[46px]">
                      {profile[key] as string}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Riwayat Poin */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4">Riwayat Poin</h2>
            <div className="divide-y divide-gray-50">
              {pointHistory.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700">{item.desc}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
                  </div>
                  <span className={`flex-none text-sm font-bold ${item.pts >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {item.pts >= 0 ? "+" : ""}{item.pts.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
