import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronRight, ChevronLeft, Plus, Minus } from "lucide-react";
import { trackFunnel } from "../utils/tracker";

const API_BASE = import.meta.env.VITE_API_BASE;

interface Ticket {
  id: string;
  type: string;
  description: string;
  price: string | number;
  quota: number;
  used_ticket: number;
}

interface Event {
  id: string;
  title: string;
  price?: number | string;
  organizer: {
    id: string;
    full_name: string;
  };
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  tickets: Ticket[];
}

interface SelectedTicket {
  id: string;
  type: string;
  price: number;
  quantity: number;
}

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
}

interface PaymentData {
  method: string;
  voucherCode: string;
  usePoints: boolean;
  pointsAmount: number;
}

const formatPrice = (price: string | number): string => {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numPrice)) return "Rp 0";
  return "Rp " + Math.floor(numPrice).toLocaleString("id-ID");
};

const parsePrice = (price: string | number): number => {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return isNaN(numPrice) ? 0 : numPrice;
};

export default function CheckoutModal({
  isOpen,
  onClose,
  event,
  tickets,
}: CheckoutModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>([]);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: "",
    email: "",
    phone: "",
  });
  const [paymentData, setPaymentData] = useState<PaymentData>({
    method: "BANK_TRANSFER",
    voucherCode: "",
    usePoints: false,
    pointsAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const displayTickets = tickets;

  const isFreeTicket = selectedTickets.length > 0 && 
    selectedTickets.every(ticket => ticket.price === 0);

  // Track checkout opens
  useEffect(() => {
    if (isOpen && event?.id) {
      trackFunnel(event.id, "checkout");
    }
  }, [isOpen, event?.id]);

  useEffect(() => {
    if (step === 3 && availableVouchers.length === 0 && !isFreeTicket) {
      const fetchVouchers = async () => {
        try {
          const response = await fetch(`${API_BASE}/promotions?event_id=${event.id}`);
          if (response.ok) {
            const data = await response.json();
            const vouchers = data.data || [];
            const validVouchers = vouchers.filter((v: any) => {
              const notExpired = !v.expires_at || new Date(v.expires_at) > new Date();
              const hasQuota = v.max_usage === null || v.used_count < v.max_usage;
              return notExpired && hasQuota;
            });
            setAvailableVouchers(validVouchers);
          }
        } catch (err) {
          console.error("Failed to fetch vouchers:", err);
        }
      };
      fetchVouchers();
    }
  }, [step, event.id, availableVouchers.length, isFreeTicket]);

  const subtotal = selectedTickets.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discount = paymentData.voucherCode.trim() ? 0 : 0;
  
  const serviceCharge = isFreeTicket ? 0 : Math.floor(subtotal * 0.1);
  const pointsReduction = paymentData.usePoints
    ? Math.min(paymentData.pointsAmount, subtotal)
    : 0;
  const finalPrice = Math.max(0, subtotal + serviceCharge - discount - pointsReduction);

  const handleTicketQuantityChange = (ticketId: string, delta: number) => {
    setSelectedTickets((prev) => {
      const existing = prev.find((t) => t.id === ticketId);
      const ticket = displayTickets.find((t) => t.id === ticketId);
      if (!ticket) return prev;

      const available = ticket.quota - ticket.used_ticket;

      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          return prev.filter((t) => t.id !== ticketId);
        }
        if (newQty > available) {
          return prev;
        }
        return prev.map((t) =>
          t.id === ticketId ? { ...t, quantity: newQty } : t
        );
      } else if (delta > 0) {
        const ticket = displayTickets.find((t) => t.id === ticketId)!;
        return [
          ...prev,
          {
            id: ticketId,
            type: ticket.type,
            price: parsePrice(ticket.price),
            quantity: 1,
          },
        ];
      }
      return prev;
    });
  };

  const isPersonalInfoValid =
    personalInfo.name.trim() &&
    personalInfo.email.includes("@") &&
    personalInfo.phone.length >= 10;


  // Submit handler
  const handleSubmit = async () => {
    if (selectedTickets.length === 0) {
      setError("Pilih minimal 1 tiket");
      return;
    }

    if (!isPersonalInfoValid) {
      setError("Data personal tidak lengkap");
      return;
    }

    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!user.id) {
      navigate(`/login?returnTo=/event/${event.id}?openCheckout=true`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {

      let firstBookingId = "";

      for (const ticket of selectedTickets) {
        const response = await fetch(`${API_BASE}/bookings`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_id: event.id,
            ticket_id: ticket.id,
            quantity: ticket.quantity,
            voucherCode: paymentData.voucherCode || undefined,
            usePoints: paymentData.usePoints,
            pointsAmount: paymentData.pointsAmount,
            isFree: isFreeTicket,
          }),
        });

        const data = await response.json();
        console.log("Booking response:", data);

        if (!response.ok || !data.success) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("user");
            navigate(`/login?returnTo=/event/${event.id}?openCheckout=true`);
            return;
          }
          setError(data.message || "Gagal membuat booking");
          return;
        }

        if (!firstBookingId) {
          firstBookingId = data.data.id;
        }
      }
      setError(null);
      setStep(1);
      setSelectedTickets([]);
      onClose();
      navigate(`/payment/${firstBookingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-40 transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-end lg:items-center justify-center z-50 pointer-events-none backdrop-blur-md">
        <div
          className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-full h-[90vh] lg:h-auto lg:max-h-[90vh] lg:w-11/12 lg:max-w-5xl flex flex-col overflow-hidden"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex gap-2">
                  {(isFreeTicket ? [1, 2, 3] : [1, 2, 3, 4]).map((s) => (
                    <div
                      key={s}
                      className={`flex-1 h-1 rounded-full transition-colors ${
                        s <= step ? "bg-orange-500" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>

                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Pilih Tiket
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Anda bisa memilih lebih dari satu jenis tiket
                      </p>
                    </div>

                    {displayTickets.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-600">
                          Tidak ada tiket yang tersedia
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {displayTickets.map((ticket) => {
                          const available =
                            ticket.quota - ticket.used_ticket;
                          const selected = selectedTickets.find(
                            (t) => t.id === ticket.id
                          );
                          return (
                            <div
                              key={ticket.id}
                              className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">
                                    {ticket.type}
                                  </h4>
                                  {ticket.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {ticket.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-2">
                                    Tersisa: {available} tiket
                                  </p>
                                </div>
                                <span className="font-bold text-orange-500 ml-4">
                                  {formatPrice(ticket.price)}
                                </span>
                              </div>

                              {/* Counter */}
                              {available > 0 && (
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() =>
                                      handleTicketQuantityChange(
                                        ticket.id,
                                        -1
                                      )
                                    }
                                    disabled={!selected}
                                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Minus size={18} className="text-gray-600" />
                                  </button>
                                  <span className="w-8 text-center font-semibold">
                                    {selected?.quantity || 0}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleTicketQuantityChange(ticket.id, 1)
                                    }
                                    disabled={selected?.quantity === available}
                                    className="p-1 hover:bg-orange-100 hover:text-orange-500 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Plus size={18} className="text-gray-600" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Data Pribadi
                      </h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={personalInfo.name}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={personalInfo.email}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Masukkan email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nomor Telepon
                      </label>
                      <input
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Masukkan nomor telepon"
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        {isFreeTicket ? "Konfirmasi Pesanan" : "Pembayaran & Promo"}
                      </h3>
                    </div>

                    {!isFreeTicket && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Metode Pembayaran
                          </label>
                          <select
                            value={paymentData.method}
                            onChange={(e) =>
                              setPaymentData({
                                ...paymentData,
                                method: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="BANK_TRANSFER">Transfer Bank</option>
                            <option value="E_WALLET">E-Wallet</option>
                            <option value="CREDIT_CARD">Kartu Kredit</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kode Voucher (Opsional)
                          </label>
                          <select
                            value={paymentData.voucherCode}
                            onChange={(e) =>
                              setPaymentData({
                                ...paymentData,
                                voucherCode: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">-- Pilih Voucher --</option>
                            {availableVouchers.map((voucher: any) => (
                              <option key={voucher.id} value={voucher.promotion_code}>
                                {voucher.promotion_code} - {voucher.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={paymentData.usePoints}
                                onChange={(e) =>
                                  setPaymentData({
                                    ...paymentData,
                                    usePoints: e.target.checked,
                                    pointsAmount: e.target.checked ? 5000 : 0,
                                  })
                                }
                                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                Gunakan Poin
                              </span>
                            </label>
                          </div>
                          {paymentData.usePoints && (
                            <div className="mt-3 ml-8">
                              <label className="block text-xs text-gray-600 mb-2">
                                Jumlah Poin
                              </label>
                              <input
                                type="number"
                                value={paymentData.pointsAmount}
                                onChange={(e) =>
                                  setPaymentData({
                                    ...paymentData,
                                    pointsAmount: parseInt(e.target.value) || 0,
                                  })
                                }
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                placeholder="0"
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {isFreeTicket && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-900 font-medium">✓ Acara Gratis!</p>
                        <p className="text-sm text-green-700 mt-2">
                          Tiket Anda akan langsung aktif setelah konfirmasi. Tidak perlu pembayaran.
                        </p>
                      </div>
                    )}

                    {isFreeTicket && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-900 font-medium">✓ Acara Gratis!</p>
                        <p className="text-sm text-green-700 mt-2">
                          Tiket Anda akan langsung aktif setelah konfirmasi. Tidak perlu pembayaran.
                        </p>
                      </div>
                    )}

                    {/* Summary untuk tiket gratis & bayar */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Ringkasan Pesanan:
                      </p>
                      <div className="space-y-2 text-sm">
                        {selectedTickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="flex justify-between text-gray-600"
                          >
                            <span>
                              {ticket.type} x {ticket.quantity}
                            </span>
                            <span>
                              {formatPrice(ticket.price * ticket.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {!isFreeTicket && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-900 mb-2">
                          📋 Catatan:
                        </p>
                        <p className="text-xs text-blue-800">
                          Nomor Virtual Account akan ditampilkan setelah Anda mengklik tombol "Konfirmasi Pembayaran"
                        </p>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      {!isFreeTicket && (
                        <div className="flex justify-between text-gray-600">
                          <span>Biaya Layanan</span>
                          <span>{formatPrice(serviceCharge)}</span>
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Diskon</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      {pointsReduction > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>Potongan Poin</span>
                          <span>-{formatPrice(pointsReduction)}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg">
                      <span>Total Bayar</span>
                      <span className="text-orange-600">
                        {formatPrice(finalPrice)}
                      </span>
                    </div>
                  </div>
                )}

                {step === 4 && !isFreeTicket && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Konfirmasi Pemesanan
                      </h3>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        ℹ️ Informasi Penting:
                      </p>
                      <p className="text-xs text-blue-800">
                        Nomor Virtual Account dan instruksi pembayaran akan ditampilkan di halaman pembayaran setelah Anda mengklik tombol Konfirmasi.
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Ringkasan Pesanan:
                      </p>
                      <div className="space-y-2 text-sm">
                        {selectedTickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="flex justify-between text-gray-600"
                          >
                            <span>
                              {ticket.type} x {ticket.quantity}
                            </span>
                            <span>
                              {formatPrice(ticket.price * ticket.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Biaya Layanan</span>
                        <span>{formatPrice(serviceCharge)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Diskon</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      {pointsReduction > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>Potongan Poin</span>
                          <span>-{formatPrice(pointsReduction)}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg">
                      <span>Total Bayar</span>
                      <span className="text-orange-600">
                        {formatPrice(finalPrice)}
                      </span>
                    </div>
                  </div>
                )}


                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary (Sticky) */}
            <div className="hidden lg:flex flex-col w-96 border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Ringkasan</h3>

              {/* Event Info */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-500 font-medium mb-1">Event</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {event.title}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Penyelenggara: {event.organizer.full_name}
                </p>
              </div>

              {/* Selected Tickets */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-500 font-medium mb-3">
                  Tiket yang Dipilih
                </p>
                {selectedTickets.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">
                    Belum ada tiket
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedTickets.map((ticket) => (
                      <div key={ticket.id} className="text-sm">
                        <div className="flex justify-between text-gray-700">
                          <span>{ticket.type}</span>
                          <span className="font-medium">x{ticket.quantity}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatPrice(ticket.price * ticket.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Biaya Layanan</span>
                  <span className="font-medium">{formatPrice(serviceCharge)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon</span>
                    <span className="font-medium">-{formatPrice(discount)}</span>
                  </div>
                )}
                {pointsReduction > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Potongan Poin</span>
                    <span className="font-medium">
                      -{formatPrice(pointsReduction)}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-300 mt-4 pt-4 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-orange-600">
                  {formatPrice(finalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-between gap-3 bg-white">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                step === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <ChevronLeft size={18} />
              Kembali
            </button>

            {step < (isFreeTicket ? 3 : 4) ? (
              <button
                onClick={() => {
                  if (step === 1 && selectedTickets.length === 0) {
                    setError("Pilih minimal 1 tiket");
                    return;
                  }
                  if (step === 2 && !isPersonalInfoValid) {
                    setError("Data personal tidak lengkap");
                    return;
                  }
                  setError(null);
                  setStep(step + 1);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors active:scale-95"
              >
                Lanjut
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg font-medium transition-colors active:scale-95 disabled:cursor-not-allowed"
              >
                {isLoading ? "Memproses..." : isFreeTicket ? "Konfirmasi & Dapatkan Tiket" : "Konfirmasi Pembayaran"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
