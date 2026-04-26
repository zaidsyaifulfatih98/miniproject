import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { loginSchema } from "../schemas/user.schema";
import { getUserFromCookie, setUserCookie } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const parsedUser = getUserFromCookie();
      if (parsedUser) {
        if (parsedUser.role?.includes("ORGANIZER")) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }

    setLoading(true);

    try {
      let response = await axios.post(
        `${API_BASE}/users/login`,
        form,
        { withCredentials: true }
      );

      if (!response.data.success) {
        response = await axios.post(
          `${API_BASE}/users/login/organizer`,
          form,
          { withCredentials: true }
        );
      }

      const { user } = response.data.data;

      setUserCookie(user);

      if (returnTo) {
        navigate(returnTo, { replace: true });
      } else if (user.role?.includes("ORGANIZER")) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Login gagal. Coba lagi.";
      setError(errorMessage);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1
            className="text-3xl font-bold tracking-widest uppercase"
            style={{ color: "#FF5C2E" }}
          >
            Masuk ke LOKAHAJAT
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Masukkan email dan password Anda untuk melanjutkan
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-none mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Login Gagal</p>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="nama@example.com"
              className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${fieldErrors.email ? "border-red-400" : "border-gray-300"}`}
              style={{ "--tw-ring-color": "#FF5C2E" } as React.CSSProperties}
            />
            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${fieldErrors.password ? "border-red-400" : "border-gray-300"}`}
              style={{ "--tw-ring-color": "#FF5C2E" } as React.CSSProperties}
            />
            {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: loading ? "#FF5C2E" : "#FF5C2E",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Memproses...
              </span>
            ) : (
              "Masuk"
            )}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-500">atau</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <p className="text-center text-sm text-gray-600">
          Belum punya akun?{" "}
          <a
            href="/register"
            className="font-semibold transition-colors hover:underline"
            style={{ color: "#FF5C2E" }}
          >
            Daftar sekarang
          </a>
        </p>
      </div>
    </div>
  );
}
