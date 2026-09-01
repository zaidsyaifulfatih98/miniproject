import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { registerSchema } from "../schemas/user.schema";
import { useLanguage } from "../i18n/LanguageContext";

const API_BASE = import.meta.env.VITE_API_BASE;

interface RegisterForm {
  full_name: string;
  email: string;
  password: string;
  birth_date: string;
  gender: string;
  address: string;
  role: string[];
  referral_code_used: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState<RegisterForm>({
    full_name: "",
    email: "",
    password: "",
    birth_date: "",
    gender: "",
    address: "",
    role: ["CUSTOMERS"],
    referral_code_used: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Client-side zod validation
    const result = registerSchema.safeParse({
      ...form,
      role: form.role as ("CUSTOMERS" | "ORGANIZER")[],
      gender: form.gender as "Male" | "Female",
    });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      });
      setFieldErrors(errs);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.referral_code_used) delete (payload as any).referral_code_used;
      await axios.post(`${API_BASE}/users`, payload);
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || t("register.registerFailedDefault"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        {/* Header */}
        <div className="mb-5 text-center">
          <h1
            className="text-3xl font-bold tracking-widest uppercase"
            style={{ color: "#FF5C2E" }}
          >
            LOKAHAJAT
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            {t("register.subtitle")}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-none mt-0.5" />
            <div>
              <p className="text-xs font-medium text-red-800">{t("register.registrationFailedTitle")}</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t("register.fullNameLabel")}</label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              placeholder={t("register.fullNamePlaceholder")}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${fieldErrors.full_name ? "border-red-400" : "border-gray-300"}`}
              style={{ "--tw-ring-color": "#FF5C2E" } as React.CSSProperties}
            />
            {fieldErrors.full_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.full_name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t("register.emailLabel")}</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder={t("register.emailPlaceholder")}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${fieldErrors.email ? "border-red-400" : "border-gray-300"}`}
              style={{ "--tw-ring-color": "#FF5C2E" } as React.CSSProperties}
            />
            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t("register.passwordLabel")}</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder={t("register.passwordPlaceholder")}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${fieldErrors.password ? "border-red-400" : "border-gray-300"}`}
              style={{ "--tw-ring-color": "#FF5C2E" } as React.CSSProperties}
            />
            {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
          </div>

          {/* Birth Date & Gender (2 Columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t("register.birthDateLabel")}</label>
              <input
                type="date"
                name="birth_date"
                value={form.birth_date}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${fieldErrors.birth_date ? "border-red-400" : "border-gray-300"}`}
                style={{ "--tw-ring-color": "#FF5C2E" } as React.CSSProperties}
              />
              {fieldErrors.birth_date && <p className="text-xs text-red-500 mt-1">{fieldErrors.birth_date}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t("register.genderLabel")}</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${fieldErrors.gender ? "border-red-400" : "border-gray-300"}`}
                style={{ "--tw-ring-color": "#FF5C2E" } as React.CSSProperties}
              >
                <option value="">{t("register.genderSelect")}</option>
                <option value="Male">{t("register.genderMale")}</option>
                <option value="Female">{t("register.genderFemale")}</option>
              </select>
              {fieldErrors.gender && <p className="text-xs text-red-500 mt-1">{fieldErrors.gender}</p>}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t("register.addressLabel")}</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              rows={2}
              placeholder={t("register.addressPlaceholder")}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition resize-none ${fieldErrors.address ? "border-red-400" : "border-gray-300"}`}
              style={{ "--tw-ring-color": "#FF5C2E" } as React.CSSProperties}
            />
            {fieldErrors.address && <p className="text-xs text-red-500 mt-1">{fieldErrors.address}</p>}
          </div>

          {/* Referral Code */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {t("register.referralCodeLabel")} <span className="text-gray-400 font-normal">{t("register.referralCodeOptional")}</span>
            </label>
            <input
              type="text"
              name="referral_code_used"
              value={form.referral_code_used}
              onChange={handleChange}
              placeholder={t("register.referralCodePlaceholder")}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition uppercase ${fieldErrors.referral_code_used ? "border-red-400" : "border-gray-300"}`}
              style={{ "--tw-ring-color": "#FF5C2E" } as React.CSSProperties}
            />
            {fieldErrors.referral_code_used
              ? <p className="text-xs text-red-500 mt-1">{fieldErrors.referral_code_used}</p>
              : <p className="text-xs text-gray-400 mt-1">{t("register.referralCodeHint")}</p>
            }
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t("register.registerAsLabel")}</label>
            <select
              name="role"
              value={form.role[0]}
              onChange={(e) => setForm((prev) => ({ ...prev, role: [e.target.value] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ "--tw-ring-color": "#FF5C2E" } as React.CSSProperties}
            >
              <option value="CUSTOMERS">{t("register.roleCustomer")}</option>
              <option value="ORGANIZER">{t("register.roleOrganizer")}</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-white font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-4"
            style={{
              backgroundColor: loading ? "#FF5C2E" : "#FF5C2E",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t("register.registering")}
              </span>
            ) : (
              t("register.submitButton")
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-3 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-500">{t("register.or")}</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Login Link */}
        <p className="text-center text-xs text-gray-600">
          {t("register.haveAccount")}{" "}
          <a
            href="/login"
            className="font-semibold transition-colors hover:underline"
            style={{ color: "#FF5C2E" }}
          >
            {t("register.loginHere")}
          </a>
        </p>
      </div>
    </div>
  );
}
