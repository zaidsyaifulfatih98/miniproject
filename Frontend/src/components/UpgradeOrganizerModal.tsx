import { AlertCircle, ArrowRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

interface UpgradeOrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function UpgradeOrganizerModal({
  isOpen,
  onClose,
  onUpgrade,
}: UpgradeOrganizerModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 sm:p-8 pointer-events-auto">
        <div className="text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-2">
            {t("upgradeOrganizerModal.title")}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            {t("upgradeOrganizerModal.description")}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onUpgrade}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors cursor-pointer text-sm sm:text-base"
            >
              {t("upgradeOrganizerModal.upgradeNow")}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-full transition-colors cursor-pointer text-sm sm:text-base"
            >
              {t("upgradeOrganizerModal.back")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
