import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";
import { createEventSchema } from "../schemas/event.schema";
import { getUserFromCookie } from "../utils/auth";
import { useLanguage } from "../i18n/LanguageContext";

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
  { value: "KONSER", labelKey: "categoryKonser" },
  { value: "WORKSHOP", labelKey: "categoryWorkshop" },
  { value: "SEMINAR", labelKey: "categorySeminar" },
  { value: "FESTIVAL", labelKey: "categoryFestival" },
  { value: "OLAHRAGA", labelKey: "categoryOlahraga" },
  { value: "LAINNYA", labelKey: "categoryLainnya" },
];

const STATUS_OPTIONS = [
  { value: "DRAFT", labelKey: "statusDraft" },
  { value: "PENDING", labelKey: "statusPending" },
  { value: "ACTIVE", labelKey: "statusActive" },
  { value: "REJECTED", labelKey: "statusRejected" },
  { value: "COMPLETED", labelKey: "statusCompleted" },
  { value: "CANCELLED", labelKey: "statusCancelled" },
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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
        const userData = getUserFromCookie();

        if (!userData) {
          navigate("/login");
          return;
        }

        const parsedUser = userData;
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

  // Validate form using Zod
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Zod validates core numeric/enum fields
    const result = createEventSchema.safeParse({
      title: formData.title,
      location: formData.location || undefined,
      description: formData.description || undefined,
      category: formData.category,
      status: formData.status,
      price: formData.price,
      total_seats: formData.totalSeats,
      start_event: formData.startDate || undefined,
      end_event: formData.endDate || undefined,
    });

    if (!result.success) {
      const fieldMap: Record<string, string> = {
        total_seats: "totalSeats",
        start_event: "startDate",
        end_event: "endDate",
      };
      result.error.issues.forEach((issue) => {
        const zodKey = issue.path[0] as string;
        const formKey = fieldMap[zodKey] ?? zodKey;
        if (!newErrors[formKey]) newErrors[formKey] = issue.message;
      });
    }

    // Extra checks not covered by schema
    if (!formData.location.trim()) newErrors.location = t("createEvent.validationLocationRequired");
    if (!formData.startDate) newErrors.startDate = t("createEvent.validationStartDateRequired");
    if (!formData.endDate) newErrors.endDate = t("createEvent.validationEndDateRequired");
    if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = t("createEvent.validationEndDateAfterStart");
    }
    if (!formData.startTime) newErrors.startTime = t("createEvent.validationStartTimeRequired");
    if (!formData.endTime) newErrors.endTime = t("createEvent.validationEndTimeRequired");
    if (!formData.description.trim() || formData.description.length < 20) {
      newErrors.description = t("createEvent.validationDescriptionMinLength");
    }
    if (formData.price > 0 && formData.price < 10000) {
      newErrors.price = t("createEvent.validationPriceMinimum");
    }
    if (!formData.image) newErrors.image = t("createEvent.validationImageRequired");

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
      setErrors((prev) => ({ ...prev, image: t("createEvent.validationImageMaxSize") }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: t("createEvent.validationImageType") }));
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
      showToast(t("createEvent.toastFixFormFirst"), "error");
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("users_id", userId);
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
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        showToast(t("createEvent.toastEventCreated"), "success");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        showToast(response.data.message || t("createEvent.toastEventCreateFailed"), "error");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || t("createEvent.toastGenericError");
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
          <p className="text-gray-600">{t("createEvent.loadingLabel")}</p>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t("createEvent.pageTitle")}</h1>
          <p className="text-gray-600">{t("createEvent.pageSubtitle")}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 sm:p-12">
            {/* Image Upload */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                {t("createEvent.labelEventImage")}
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
                    <p className="text-gray-900 font-semibold text-lg mb-2">{t("createEvent.uploadClickPrompt")}</p>
                    <p className="text-sm text-gray-500">{t("createEvent.uploadHint")}</p>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t("createEvent.sectionBasicInfo")}</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("createEvent.labelEventName")}
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={t("createEvent.placeholderEventName")}
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
                  {t("createEvent.labelLocation")}
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder={t("createEvent.placeholderLocation")}
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
                  {t("createEvent.labelCategory")}
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 transition"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {t(`createEvent.${cat.labelKey}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("createEvent.labelStatus")}
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 transition"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {t(`createEvent.${status.labelKey}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("createEvent.labelStartDate")}
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
                    {t("createEvent.labelEndDate")}
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
                    {t("createEvent.labelStartTime")}
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
                    {t("createEvent.labelEndTime")}
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
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t("createEvent.sectionVenuePricing")}</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("createEvent.labelVenueCapacity")}
                </label>
                <input
                  type="number"
                  name="totalSeats"
                  value={formData.totalSeats || ""}
                  onChange={handleInputChange}
                  placeholder={t("createEvent.placeholderVenueCapacity")}
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
                  {t("createEvent.labelTicketPrice")}
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price || ""}
                  onChange={handleInputChange}
                  placeholder={t("createEvent.placeholderTicketPrice")}
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
                  {t("createEvent.hintFreeEvent")}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t("createEvent.sectionDescription")}</h2>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("createEvent.labelFullDescription")}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={t("createEvent.placeholderFullDescription")}
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
                {t("createEvent.hintDescriptionLength")}
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                {t("createEvent.cancelButton")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
              >
                {submitting ? t("createEvent.submittingButton") : t("createEvent.submitButton")}
              </button>
            </div>
          </form>
        </div>

        {/* Helper Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">{t("createEvent.tipsTitle")}</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>{t("createEvent.tip1")}</li>
            <li>{t("createEvent.tip2")}</li>
            <li>{t("createEvent.tip3")}</li>
            <li>{t("createEvent.tip4")}</li>
            <li>{t("createEvent.tip5")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
