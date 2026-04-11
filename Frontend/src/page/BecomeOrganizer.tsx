import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Zap, Tag, ArrowRight } from "lucide-react";
import UpgradeOrganizerModal from "../components/UpgradeOrganizerModal";

interface User {
  id: string;
  role: string[];
}

export default function BecomeOrganizer() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check user auth status
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          if (parsedUser.role?.includes("ORGANIZER")) {
            navigate("/create-event", { replace: true });
            return;
          }
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleStartAsOrganizer = () => {
    if (!user) {
      navigate("/login");
    } else if (!user.role?.includes("ORGANIZER")) {
      setShowUpgradeModal(true);
    } else {
      navigate("/create-event");
    }
  };

  const handleUpgradeClick = () => {
    navigate("/register");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 min-h-72 sm:min-h-80 md:min-h-96 lg:min-h-[500px] flex items-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative overflow-hidden rounded-none md:rounded-3xl md:mx-4 lg:mx-8 md:my-6">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 300">
            <circle cx="50" cy="50" r="30" fill="white" />
            <circle cx="350" cy="250" r="40" fill="white" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-white">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-5 leading-tight">
                Berdayakan acara Anda dan jangkau ribuan penggemar tiket
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-orange-100 mb-6 sm:mb-8 leading-relaxed max-w-lg">
                Kami menyediakan solusi manajemen acara terpadu yang memudahkan Anda menjual tiket, mengelola peserta, dan mengembangkan bisnis acara Anda dengan teknologi terdepan.
              </p>
              <button
                onClick={handleStartAsOrganizer}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-2 sm:py-3 bg-white text-orange-600 font-semibold rounded-full hover:bg-orange-50 transition-colors cursor-pointer text-sm sm:text-base"
              >
                {user ? "Mulai Jadi Organizer" : "Mulai Sekarang"}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Right Images */}
            <div className="hidden lg:flex justify-center items-center relative">
              <div className="relative w-full max-w-sm h-80">
                {/* Image 1*/}
                <div className="absolute top-0 right-0 w-56 h-48 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-3xl shadow-lg transform rotate-6 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    🎪
                  </div>
                </div>

                {/* Image 2 */}
                <div className="absolute top-24 left-0 w-56 h-48 bg-gradient-to-br from-pink-200 to-pink-300 rounded-3xl shadow-lg transform -rotate-3 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    🎸
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-8 sm:py-10 md:py-14 px-4 sm:px-6 lg:px-8 min-h-80 sm:min-h-96 flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <Award className="w-6 h-6 text-orange-500" />
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Keuntungan Organizer</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Fitur Unggulan</h2>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200 hover:border-orange-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Award className="text-orange-600" size={18} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Kontrol Penuh</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Mulai menjual tiket dalam hitungan menit. Dapatkan kontrol penuh atas segala aspek acara Anda mulai dari tanggal, kapasitas, jenis tiket, hingga detail lainnya.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200 hover:border-orange-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="text-orange-600" size={18} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Teknologi Terdepan</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Manfaatkan teknologi terkini dengan integrasi canggih dan fitur otomasi untuk menangani kebutuhan penjualan tiket yang kompleks sekalipun.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200 hover:border-orange-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Tag className="text-orange-600" size={18} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Jual Dimana Saja</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Jual tiket langsung dari website Anda atau manfaatkan portal penjualan mandiri yang dapat disesuaikan dan responsif untuk mobile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefit Section */}
      <section className="bg-white py-8 sm:py-10 md:py-14 px-4 sm:px-6 lg:px-8 min-h-80 sm:min-h-96 flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
            {/* Image */}
            <div className="order-2 md:order-1 flex justify-center md:justify-start">
              <div className="relative w-full max-w-sm md:max-w-lg aspect-video bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl overflow-hidden shadow-lg flex items-center justify-center">
                <div className="text-center text-white text-4xl sm:text-5xl">🎉</div>
              </div>
            </div>

            {/* Content */}
            <div className="order-1 md:order-2">
              <p className="text-xs sm:text-sm text-orange-600 font-medium mb-2">Testimoni & Keberhasilan</p>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                Seribu Acara Telah Dipercayai
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-3 leading-relaxed">
                Bergabunglah dengan ribuan penyelenggara acara yang telah mempercayai platform kami untuk mengelola tiket dan peserta mereka. Dari konser musik kecil hingga festival besar, kami siap mendukung kesuksesan acara Anda.
              </p>
              <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                Dengan fitur lengkap, keamanan terjamin, dan customer support yang responsif, kami memastikan pengalaman terbaik untuk Anda dan peserta acara Anda.
              </p>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                ✓ Dipercaya oleh 10,000+ penyelenggara acara di seluruh Indonesia
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-8 sm:py-10 md:py-14 px-4 sm:px-6 lg:px-8 min-h-80 sm:min-h-96 flex items-center">
        <div className="max-w-2xl mx-auto w-full text-center">
          <p className="text-xs sm:text-sm text-orange-600 font-medium mb-2">Siap Memulai</p>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
            Jadilah Organizer dan Kelola Acara Anda
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
            Dapatkan akses penuh ke fitur-fitur canggih untuk mengelola acara Anda dengan lebih mudah dan menjangkau ribuan pembeli tiket.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center flex-wrap">
            <button
              onClick={handleStartAsOrganizer}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-2 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors cursor-pointer text-sm sm:text-base"
            >
              Mulai Jadi Organizer
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Upgrade Modal */}
      <UpgradeOrganizerModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgradeClick}
      />
    </div>
  );
}
