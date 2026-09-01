import { useState } from "react";
import axios from "axios";
import { Check, X, Loader } from "lucide-react";
import { formatCurrency, validateVoucher } from "../utils/discountCalculator";
import { useLanguage } from "../i18n/LanguageContext";

const API_BASE = import.meta.env.VITE_API_BASE;

interface Voucher {
  id: string;
  name: string;
  promotion_code: string;
  discount_amount: number;
  type: "VOUCHER" | "FLASH_SALE" | "BUNDLE" | "LAINNYA";
  max_usage: number | null;
  used_count: number | null;
  expires_at: string | null;
  event_id: string;
}

interface VoucherInputProps {
  eventId: string;
  onVoucherApply: (voucher: Voucher) => void;
  onVoucherRemove: () => void;
  appliedVoucher: Voucher | null;
}

export default function VoucherInput({
  eventId,
  onVoucherApply,
  onVoucherRemove,
  appliedVoucher,
}: VoucherInputProps) {
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!code.trim()) {
      setError(t("voucherInput.enterCode"));
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/promos/validate`, {
        promotion_code: code.toUpperCase(),
        event_id: eventId,
      });

      const voucher: Voucher = res.data.data;

      // Validate voucher
      const validation = validateVoucher(
        voucher.expires_at,
        voucher.used_count,
        voucher.max_usage
      );

      if (!validation.isValid) {
        setError(validation.error || t("voucherInput.invalidVoucherDefault"));
        return;
      }

      setSuccess(true);
      onVoucherApply(voucher);
      setCode("");

      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || t("voucherInput.notFoundDefault");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (appliedVoucher) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">{t("voucherInput.appliedTitle")}</p>
              <p className="text-sm text-green-700 mt-1">
                {appliedVoucher.name} ({appliedVoucher.promotion_code})
              </p>
              <p className="text-sm text-green-700">
                {t("voucherInput.discountLabel")}: {formatCurrency(appliedVoucher.discount_amount)}
              </p>
            </div>
          </div>
          <button
            onClick={onVoucherRemove}
            className="text-green-600 hover:text-green-700 font-semibold text-sm"
          >
            {t("voucherInput.remove")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">{t("voucherInput.haveVoucherCode")}</label>

      <form onSubmit={handleApply} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError("");
            setSuccess(false);
          }}
          placeholder={t("voucherInput.placeholder")}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 uppercase"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              {t("voucherInput.validating")}
            </>
          ) : (
            t("voucherInput.apply")
          )}
        </button>
      </form>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-700">{t("voucherInput.appliedSuccess")}</p>
        </div>
      )}
    </div>
  );
}
