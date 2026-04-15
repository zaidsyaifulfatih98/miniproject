import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { MapPin, Calendar, Layers, X } from "lucide-react";

import DOMPurify from "dompurify";
import CheckoutModal from "../components/CheckoutModal";

const API_BASE = import.meta.env.VITE_API_BASE;

type EventStatus =
  | "DRAFT"
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";
type TabType = "deskripsi" | "tiket" | "syarat";

interface EventDetail {
  id: string;
  title: string;
  location: string | null;
  start_event: string | null;
  end_event: string | null;
  start_time: string | null;
  end_time: string | null;
  total_seats: number;
  available_seats: number;
  description: string | null;
  category: string | null;
  status: EventStatus;
  price: number | string;
  organizer: {
    id: string;
    full_name: string;
    email?: string;
  };
  tickets?: Array<{
    id: string;
    type: string;
    description: string;
    price: number | string;
    quota: number;
    used_ticket: number;
  }>;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

export default function DetailEvent() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("deskripsi");
  const [toast, setToast] = useState<Toast | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Fetch event detail
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/events/${eventId}`);
        if (!response.ok) throw new Error("Event not found");
        const data = await response.json();
        if (data.success) {
          setEvent(data.data);
          setError(null);
          
          if (searchParams.get("openCheckout") === "true") {
            setIsCheckoutOpen(true);
          }
        } else {
          throw new Error(data.message || "Failed to load event");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId, searchParams]);

  const isSoldOut = event && event.available_seats <= 0;

  const isEventEnded =
    event && event.end_event && new Date(event.end_event) < new Date();

  const getButtonState = () => {
    if (isEventEnded) {
      return { disabled: true, text: "Event Ended", color: "bg-gray-400" };
    }
    if (isSoldOut) {
      return { disabled: true, text: "Sold Out", color: "bg-gray-400" };
    }
    return {
      disabled: false,
      text: "Beli Tiket",
      color: "bg-orange-500 hover:bg-orange-600",
    };
  };

  const buttonState = getButtonState();

  // Format date and time
  const formatDateTime = (date: string | null, time: string | null) => {
    if (!date) return "-";
    const dateObj = new Date(date);
    const formatted = dateObj.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (time) {
      const timeObj = new Date(time);
      const timeFormatted = timeObj.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${formatted}, ${timeFormatted}`;
    }
    return formatted;
  };

  // Format price
  const formatPrice = (price: number | string): string => {
    if (price === undefined || price === null) return "GRATIS";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "GRATIS";
    if (numPrice === 0 || numPrice < 0.01) return "GRATIS";
    return "Rp " + Math.floor(numPrice).toLocaleString("id-ID");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat detail event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-xl font-semibold">
            {error || "Event tidak ditemukan"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-white z-50 flex items-center gap-2 ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Banner Section */}
      <div
        className="relative h-64 md:h-80 bg-gradient-to-r from-orange-600 to-amber-700 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(194, 97, 25, 0.8), rgba(180, 83, 9, 0.8))`,
        }}
      >
        <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8 lg:p-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight max-w-2xl">
            {event.title}
          </h1>

          <div className="space-y-2 text-white">
            {event.location && (
              <div className="flex items-center gap-2 text-sm md:text-base">
                <MapPin size={20} className="flex-shrink-0" />
                <span>{event.location}</span>
              </div>
            )}

            {event.start_event && (
              <div className="flex items-center gap-2 text-sm md:text-base">
                <Calendar size={20} className="flex-shrink-0" />
                <span>
                  {formatDateTime(event.start_event, event.start_time)}
                  {event.end_event &&
                    ` - ${formatDateTime(event.end_event, event.end_time)}`}
                </span>
              </div>
            )}

            {event.category && (
              <div className="flex items-center gap-2 text-sm md:text-base">
                <Layers size={20} className="flex-shrink-0" />
                <span>{event.category}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-6 md:gap-8 border-b border-gray-300 mb-8 overflow-x-auto">
          {(["deskripsi", "tiket", "syarat"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-medium transition-all whitespace-nowrap relative text-sm md:text-base cursor-pointer ${
                activeTab === tab
                  ? "text-orange-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab === "deskripsi" && "Deskripsi"}
              {tab === "tiket" && "Tiket"}
              {tab === "syarat" && "Syarat dan Ketentuan"}

              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500"></div>
              )}
            </button>
          ))}
        </div>

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-0 relative lg:min-h-screen">
          {/* Left Content Area */}
          <div className="flex-1 lg:pr-96 relative z-10">
            {/* Description Tab */}
            {activeTab === "deskripsi" && (
              <div className="animate-fadeIn">
                <div className="bg-white rounded-lg p-6 md:p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {event.title}
                  </h2>
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-4">
                    {event.description ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(event.description),
                        }}
                        className="text-justify"
                      />
                    ) : (
                      <p className="text-gray-500 italic">
                        Deskripsi event tidak tersedia
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Ticket Tab */}
            {activeTab === "tiket" && (
              <div className="animate-fadeIn">
                <div className="bg-white rounded-lg p-6 md:p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Pilih Tiket
                  </h2>

                  {isSoldOut ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                      <p className="text-red-600 font-semibold text-lg mb-2">
                        Tiket Sudah Habis
                      </p>
                      <p className="text-red-500 text-sm">
                        Event ini tidak memiliki tiket yang tersedia lagi
                      </p>
                    </div>
                  ) : event.tickets && event.tickets.length > 0 ? (
                    <div className="space-y-4">
                      {event.tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {ticket.type}
                              </h3>
                              {ticket.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {ticket.description}
                                </p>
                              )}
                            </div>
                            <span className="text-lg font-bold text-orange-500 ml-4">
                              {formatPrice(ticket.price)}
                            </span>
                          </div>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>Kuota: {ticket.quota}</span>
                            <span>Terjual: {ticket.used_ticket}</span>
                            <span>
                              Tersisa: {ticket.quota - ticket.used_ticket}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-600">
                        Informasi tiket tidak tersedia untuk event ini
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Terms Tab */}
            {activeTab === "syarat" && (
              <div className="animate-fadeIn">
                <div className="bg-white rounded-lg p-6 md:p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Syarat dan Ketentuan
                  </h2>
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-4">
                    <p className="text-gray-600">
                      Syarat dan ketentuan untuk event ini belum tersedia.
                      Hubungi penyelenggara untuk informasi lebih lanjut.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Card (Desktop Only) */}
          <div className="hidden lg:block w-80 lg:absolute lg:right-0 lg:top-0 lg:-mt-73">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Event Poster Placeholder */}
                <div className="h-48 overflow-hidden bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-gray-600 text-center px-4">
                    📸 Event Image
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1.5">
                      Harga mulai dari
                    </p>
                    <p className="text-3xl font-bold text-orange-500">
                      {formatPrice(event.price)}
                    </p>
                  </div>

                  <button
                    onClick={() => !buttonState.disabled && setIsCheckoutOpen(true)}
                    disabled={buttonState.disabled}
                    className={`w-full py-2.5 px-4 rounded-lg font-semibold text-white transition-all duration-200 text-sm relative z-10 pointer-events-auto ${
                      buttonState.disabled
                        ? "cursor-not-allowed opacity-70"
                        : "cursor-pointer active:scale-95"
                    } ${buttonState.color}`}
                  >
                    {buttonState.text}
                  </button>

                  {/* Event Details */}
                  <div className="space-y-2.5 py-4 border-t border-b border-gray-200">
                    {event.location && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">
                          Lokasi
                        </p>
                        <p className="text-sm font-medium text-gray-900 flex items-start gap-2">
                          <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                          <span>{event.location}</span>
                        </p>
                      </div>
                    )}

                    {event.start_event && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">
                          Waktu
                        </p>
                        <p className="text-sm font-medium text-gray-900 flex items-start gap-2">
                          <Calendar
                            size={16}
                            className="mt-0.5 flex-shrink-0"
                          />
                          <span>
                            {formatDateTime(
                              event.start_event,
                              event.start_time,
                            )}
                          </span>
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">
                        Tiket Tersedia
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {isSoldOut
                          ? "Sold Out"
                          : `${event.available_seats} tiket`}
                      </p>
                    </div>
                  </div>

                  {/* Organizer */}
                  {event.organizer && (
                    <div className="py-3">
                      <p className="text-xs text-gray-500 font-medium mb-2.5">
                        Diselenggarakan oleh
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {event.organizer.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {event.organizer.full_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Button */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
          <button
            onClick={() => !buttonState.disabled && setIsCheckoutOpen(true)}
            disabled={buttonState.disabled}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 relative z-10 pointer-events-auto ${
              buttonState.disabled
                ? "cursor-not-allowed opacity-70"
                : "cursor-pointer active:scale-95"
            } ${buttonState.color}`}
          >
            {buttonState.text}
          </button>
        </div>

        {/* Mobile Bottom Padding */}
        <div className="lg:hidden h-24"></div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>

      {/* Checkout Modal */}
      {event && event.tickets && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          event={{
            id: event.id,
            title: event.title,
            organizer: event.organizer,
          }}
          tickets={event.tickets}
        />
      )}
    </div>
  );
}

