
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Camera, Lock, Coins } from "lucide-react";
import { getUserFromCookie, setUserCookie } from "../utils/auth";
import { useLanguage } from "../i18n/LanguageContext";

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

type EditableDraft = Pick<UserProfile, "full_name" | "email" | "birth_date" | "gender" | "address">;

export default function Admin() {
  const { t } = useLanguage();
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

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Points
  const [availablePoints, setAvailablePoints] = useState(0);

  // Change password
  const [pwdModal, setPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const [pwdError, setPwdError] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState("");

  useEffect(() => {
    const storedUser = getUserFromCookie();
    if (!storedUser) return;
    const { id } = storedUser;

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
        return axios.get(`${API_BASE}/users/${id}/points-history`);
      })
      .then((res) => {
        if (res?.data?.data) setAvailablePoints(res.data.data.available_points ?? 0);
      })
      .catch(() => setError(t("admin.loadProfileError")))
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
      setError(t("admin.saveChangesError"));
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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
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
      // Sync to cookie so Navbar/Sidebar reflect the change
      const stored = getUserFromCookie();
      if (stored) {
        setUserCookie({ ...stored, profile_picture: newPicture });
        window.dispatchEvent(new Event("storage"));
      }
    } catch {
      setError(t("admin.uploadPhotoError"));
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleChangePassword() {
    if (pwdForm.next !== pwdForm.confirm) { setPwdError(t("admin.passwordMismatch")); return; }
    if (pwdForm.next.length < 6) { setPwdError(t("admin.passwordTooShort")); return; }
    setPwdSaving(true); setPwdError(""); setPwdSuccess("");
    try {
      await axios.post(
        `${API_BASE}/users/${profile?.id}/change-password`,
        { currentPassword: pwdForm.current, newPassword: pwdForm.next },
        { withCredentials: true }
      );
      setPwdSuccess(t("admin.passwordChanged"));
      setPwdForm({ current: "", next: "", confirm: "" });
      setTimeout(() => { setPwdModal(false); setPwdSuccess(""); }, 1500);
    } catch (err: any) {
      setPwdError(err.response?.data?.message || t("admin.changePasswordError"));
    } finally {
      setPwdSaving(false);
    }
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
        <p className="text-gray-400 text-sm">{t("admin.loadingProfile")}</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500 text-sm">{error || t("admin.profileNotFound")}</p>
      </div>
    );
  }

  const fields: { key: keyof EditableDraft; label: string; type?: string }[] = [
    { key: "full_name", label: t("admin.fieldFullName") },
    { key: "email", label: t("admin.fieldEmail"), type: "email" },
    { key: "birth_date", label: t("admin.fieldBirthDate"), type: "date" },
    { key: "gender", label: t("admin.fieldGender") },
    { key: "address", label: t("admin.fieldAddress") },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{t("admin.pageTitle")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("admin.pageSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Col 1: Avatar card ── */}
        <div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-4">
            <div className="relative">
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={profile.full_name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-orange-200 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-md">
                  {avatarInitials}
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-0 right-0 bg-white border-2 border-orange-300 rounded-full p-1.5 hover:bg-orange-50 transition shadow"
                title={t("admin.changePhotoTitle")}
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
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{profile.full_name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>
              <div className="flex gap-1.5 flex-wrap justify-center mt-2">
                {profile.role.map((r) => (
                  <span key={r} className="px-3 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                    {r === "ORGANIZER" ? t("admin.roleOrganizer") : t("admin.roleCustomer")}
                  </span>
                ))}
              </div>
            </div>
            <div className="w-full rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Coins className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">{t("admin.activePoints")}</span>
              </div>
              <p className="text-2xl font-extrabold text-orange-600">{availablePoints.toLocaleString("id-ID")}</p>
            </div>
            <div className="w-full border-t border-gray-100 pt-4 text-center">
              <p className="text-xs text-gray-400">{t("admin.joinedSince")}</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{joinDate}</p>
            </div>
            <div className="w-full border-t border-gray-100 pt-4">
              <div className="text-center">
                <p className="text-xs text-gray-400">{t("admin.referralCode")}</p>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="font-mono font-bold text-sm text-gray-800 tracking-wider">{profile.referral_code}</span>
                  <button onClick={handleCopy} title={t("admin.copyReferralCode")} className="text-gray-400 hover:text-indigo-500 transition-colors">
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
                <h2 className="font-bold text-gray-800">{t("admin.profileInfoTitle")}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{t("admin.profileInfoSubtitle")}</p>
              </div>
              {!editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setPwdModal(true)}
                    className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    {t("admin.changePasswordButton")}
                  </button>
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {t("admin.editProfileButton")}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleCancel} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                    {t("admin.cancelButton")}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {saving ? t("admin.saving") : t("admin.saveButton")}
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
                        <option value="">{t("admin.selectGenderPlaceholder")}</option>
                        <option value="Male">{t("admin.genderMale")}</option>
                        <option value="Female">{t("admin.genderFemale")}</option>
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
                        : profile[key] || t("admin.emptyValue")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {pwdModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" /> {t("admin.changePasswordModalTitle")}
            </h3>
            <button
              onClick={() => { setPwdModal(false); setPwdError(""); setPwdSuccess(""); setPwdForm({ current: "", next: "", confirm: "" }); }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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
              { key: "current", label: t("admin.fieldCurrentPassword") },
              { key: "next", label: t("admin.fieldNewPassword") },
              { key: "confirm", label: t("admin.fieldConfirmPassword") },
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
              {t("admin.cancelButton")}
            </button>
            <button
              onClick={handleChangePassword}
              disabled={pwdSaving}
              className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-semibold text-sm disabled:opacity-60"
            >
              {pwdSaving ? t("admin.saving") : t("admin.savePasswordButton")}
            </button>
          </div>
          <div className="mt-4 text-center">
            <a href="/forgot-password" className="text-xs text-orange-500 hover:underline">{t("admin.forgotOldPassword")}</a>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

