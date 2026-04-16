import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Upload, AlertCircle, CheckCircle, XCircle, RotateCw } from 'lucide-react';
import { formatCurrency, calculateCountdown, formatCountdown, type CountdownTime } from '../utils/dateFormatter';

const API_BASE = import.meta.env.VITE_API_BASE;

type BookingStatus = 'WAITING_FOR_PAYMENTS' | 'WAITING_FOR_CONFIRMATION' | 'DONE' | 'CANCELLED' | 'EXPIRED';

interface BookingDetail {
  id: string;
  display_id: string;
  user_id: string;
  event_id: string;
  ticket_id: string;
  quantity: number;
  status: BookingStatus;
  total_price: number | string;
  discount_amount: number | string;
  points_used: number;
  final_price: number | string;
  expires_at: string;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    title: string;
  };
  ticket?: {
    id: string;
    type: string;
    price: number | string;
  };
  payment?: {
    id: string;
    status: string;
    payment_proof_url?: string;
  };
}

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function PaymentPortal() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  // State Management
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [countdown, setCountdown] = useState<CountdownTime>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE}/bookings/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Booking tidak ditemukan');
        
        const data = await response.json();
        if (data.success) {
          setBooking(data.data);
          setError(null);
        } else {
          throw new Error(data.message || 'Failed to load booking');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  useEffect(() => {
    if (!booking?.expires_at) return;

    const timer = setInterval(() => {
      const countdown = calculateCountdown(booking.expires_at);
      setCountdown(countdown);

      // Validation: max payment window should be 2 hours
      const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
      const expiresAt = new Date(booking.expires_at).getTime();
      const createdAt = new Date(booking.createdAt).getTime();
      const totalWindow = expiresAt - createdAt;
      
      if (totalWindow > TWO_HOURS_MS + 60000) { 
        console.warn(`[VALIDATION] Payment window exceeds 2 hours: ${Math.round(totalWindow / 1000 / 60)} minutes`);
      }

      if (countdown.isExpired) {
        clearInterval(timer);
        // Auto refresh booking status
        handleRefreshStatus();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [booking?.expires_at]);

  const handleRefreshStatus = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBooking(data.data);
          showToast('Status berhasil diperbarui', 'success');
        }
      } else {
        showToast('Gagal memperbarui status', 'error');
      }
    } catch (err) {
      console.error('Failed to refresh status:', err);
      showToast('Terjadi kesalahan saat memperbarui status', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      showToast('Format file tidak valid. Gunakan JPG, PNG, atau PDF', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file terlalu besar (max 2MB)', 'error');
      return;
    }

    setUploadFile(file);

    if (validTypes.slice(0, 2).includes(file.type)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('Pilih file terlebih dahulu', 'error');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('proof', uploadFile);

      const response = await fetch(`${API_BASE}/bookings/${bookingId}/proof`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Gagal upload bukti pembayaran');

      const data = await response.json();
      if (data.success) {
        setBooking(data.data);
        setUploadFile(null);
        setUploadPreview(null);
        showToast('Bukti pembayaran berhasil diunggah. Menunggu konfirmasi admin', 'success');
      } else {
        throw new Error(data.message || 'Failed to upload proof');
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal upload bukti pembayaran',
        'error'
      );
    } finally {
      setUploading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-gray-600">Memuat transaksi...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Transaksi Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">{error || 'Booking tidak dapat ditemukan'}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const subtotal = parseFloat(booking.total_price.toString());
  const discount = parseFloat(booking.discount_amount.toString());
  const pointsUsed = booking.points_used || 0;
  const final = parseFloat(booking.final_price.toString());

  const isPaymentAllowed =
    booking.status === 'WAITING_FOR_PAYMENTS' && !countdown.isExpired;
  const isFinalized =
    booking.status === 'DONE' || booking.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-600 to-amber-700 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => navigate('/profile?tab=transactions')}
            className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={20} />
            <span>Kembali</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-bold">Portal Pembayaran</h1>
          <p className="text-orange-100 mt-2">Invoice: {booking.display_id}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {booking.display_id}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Dibuat: {new Date(booking.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div
                  className={`px-4 py-2 rounded-full font-semibold text-sm ${
                    booking.status === 'DONE'
                      ? 'bg-green-100 text-green-800'
                      : booking.status === 'WAITING_FOR_CONFIRMATION'
                      ? 'bg-blue-100 text-blue-800'
                      : booking.status === 'CANCELLED' || booking.status === 'EXPIRED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {booking.status === 'WAITING_FOR_PAYMENTS' && 'Menunggu Pembayaran'}
                  {booking.status === 'WAITING_FOR_CONFIRMATION' && 'Menunggu Konfirmasi'}
                  {booking.status === 'DONE' && 'Terbayar'}
                  {booking.status === 'CANCELLED' && 'Dibatalkan'}
                  {booking.status === 'EXPIRED' && 'Kadaluarsa'}
                </div>
              </div>

              {isPaymentAllowed && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 text-orange-800 font-semibold mb-2">
                    <Clock size={20} />
                    <span>Sisa waktu pembayaran</span>
                  </div>
                  <div className="text-3xl font-bold text-orange-600 font-mono">
                    {formatCountdown(countdown)}
                  </div>
                  <p className="text-sm text-orange-700 mt-2">
                    Transaksi akan dibatalkan jika waktu habis
                  </p>
                </div>
              )}

              {countdown.isExpired && !isFinalized && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 text-red-800 font-semibold">
                    <XCircle size={20} />
                    <span>Waktu pembayaran telah habis</span>
                  </div>
                  <p className="text-sm text-red-700 mt-2">
                    Transaksi ini telah dibatalkan secara otomatis
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Detail Transaksi</h3>

              <div className="border-b border-gray-200 pb-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Event</p>
                <p className="font-semibold text-gray-900">{booking.event?.title}</p>
                <p className="text-sm text-gray-600 mt-2">Tiket</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {booking.ticket?.type} x {booking.quantity}
                  </span>
                  <span className="font-medium text-gray-900">
                    Rp {subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <span>Diskon Voucher</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}

                {pointsUsed > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <span>Potongan Poin ({pointsUsed} poin)</span>
                    <span>-{formatCurrency(pointsUsed)}</span>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border-2 border-orange-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Total Bayar</span>
                  <span className="text-3xl font-bold text-orange-600">
                    {formatCurrency(final)}
                  </span>
                </div>
              </div>
            </div>

            {isPaymentAllowed && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Instruksi Pembayaran</h3>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    Pilih salah satu metode pembayaran di bawah ini:
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl font-bold text-blue-600">🏦</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Transfer Bank</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          BCA - PT LokaHajat
                        </p>
                        <div className="bg-gray-100 p-3 rounded font-mono text-sm font-semibold text-gray-900">
                          1234567890
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Gunakan nomor invoice sebagai keterangan transfer
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl font-bold text-purple-600">💳</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Virtual Account</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Mandiri Virtual Account
                        </p>
                        <div className="bg-gray-100 p-3 rounded font-mono text-sm font-semibold text-gray-900">
                          888{booking.id.slice(0, 10).toUpperCase().replace(/-/g, '')}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          VA otomatis tersedia di aplikasi mobile banking
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl font-bold text-green-600">📱</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">E-Wallet</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          GCash, Dana, OVO
                        </p>
                        <p className="text-xs text-gray-500">
                          Hubungi customer support untuk mendapat nomor e-wallet tujuan
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isPaymentAllowed && (
              <form onSubmit={handleUploadProof} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Unggah Bukti Pembayaran</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Pilih File (JPG, PNG, atau PDF - Max 2MB)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="hidden"
                      id="proof-upload"
                    />
                    <label
                      htmlFor="proof-upload"
                      className="flex items-center justify-center gap-2 border-2 border-dashed border-orange-300 rounded-lg p-8 cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-50"
                    >
                      <Upload size={24} className="text-orange-500" />
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">
                          {uploadFile ? uploadFile.name : 'Klik untuk upload atau drag & drop'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {uploadFile && `${(uploadFile.size / 1024).toFixed(2)} KB`}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {uploadPreview && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <img
                        src={uploadPreview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Mengupload...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      <span>Upload Bukti Pembayaran</span>
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-3 text-center">
                  Setelah upload, tim kami akan memverifikasi bukti pembayaran dalam 1-2 jam
                </p>
              </form>
            )}
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Status Transaksi</h3>

                <div className="space-y-4">
                  <div
                    className={`flex items-start gap-3 ${
                      ['WAITING_FOR_PAYMENTS', 'WAITING_FOR_CONFIRMATION', 'DONE'].includes(
                        booking.status
                      )
                        ? ''
                        : 'opacity-50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white ${
                        ['WAITING_FOR_CONFIRMATION', 'DONE'].includes(booking.status)
                          ? 'bg-green-500'
                          : booking.status === 'EXPIRED' || booking.status === 'CANCELLED'
                          ? 'bg-red-500'
                          : 'bg-orange-500'
                      }`}
                    >
                      {['WAITING_FOR_CONFIRMATION', 'DONE'].includes(booking.status) ? '✓' : booking.status === 'EXPIRED' || booking.status === 'CANCELLED' ? '✗' : '1'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Upload Bukti Pembayaran</p>
                      <p className="text-xs text-gray-500">
                        {isPaymentAllowed
                          ? 'Menunggu Anda'
                          : booking.status === 'WAITING_FOR_CONFIRMATION'
                          ? 'Sudah dikirim'
                          : booking.status === 'DONE'
                          ? 'Terverifikasi'
                          : booking.status === 'EXPIRED'
                          ? 'Waktu habis'
                          : 'Dibatalkan'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-start gap-3 ${
                      ['WAITING_FOR_CONFIRMATION', 'DONE'].includes(booking.status)
                        ? ''
                        : 'opacity-50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white ${
                        booking.status === 'DONE' ? 'bg-green-500' : booking.status === 'EXPIRED' || booking.status === 'CANCELLED' ? 'bg-red-300' : 'bg-gray-300'
                      }`}
                    >
                      {booking.status === 'DONE' ? '✓' : '2'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Verifikasi Admin</p>
                      <p className="text-xs text-gray-500">
                        {booking.status === 'DONE'
                          ? 'Terverifikasi'
                          : booking.status === 'WAITING_FOR_CONFIRMATION'
                          ? 'Dalam proses'
                          : booking.status === 'EXPIRED'
                          ? 'Dibatalkan (Waktu habis)'
                          : booking.status === 'CANCELLED'
                          ? 'Dibatalkan'
                          : 'Menunggu'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-start gap-3 ${
                      booking.status === 'DONE' ? '' : 'opacity-50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white ${
                        booking.status === 'DONE' ? 'bg-green-500' : booking.status === 'EXPIRED' || booking.status === 'CANCELLED' ? 'bg-red-300' : 'bg-gray-300'
                      }`}
                    >
                      {booking.status === 'DONE' ? '✓' : '3'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Selesai</p>
                      <p className="text-xs text-gray-500">
                        {booking.status === 'DONE' ? 'Tiket siap diunduh' : booking.status === 'EXPIRED' ? 'Transaksi dibatalkan (Waktu habis)' : booking.status === 'CANCELLED' ? 'Transaksi dibatalkan' : 'Menunggu'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                {booking.status === 'DONE' && (
                  <>
                    <button
                      onClick={() => navigate('/profile?tab=tickets')}
                      className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} />
                      <span>Lihat Tiket Saya</span>
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                      Tiket Anda siap untuk diunduh
                    </p>
                  </>
                )}

                {booking.status === 'CANCELLED' || booking.status === 'EXPIRED' ? (
                  <>
                    <button
                      onClick={() => navigate('/')}
                      className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      Kembali ke Beranda
                    </button>
                    <p className="text-xs text-red-600 text-center font-medium">
                      Pemesanan Anda telah dibatalkan
                    </p>
                  </>
                ) : (
                  <button
                    onClick={handleRefreshStatus}
                    disabled={refreshing}
                    className="w-full px-4 py-2 bg-gray-500 hover:bg-orange-500 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    <span>{refreshing ? 'Memperbarui...' : 'Perbarui Status'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg font-medium flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : toast.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <XCircle size={20} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
