import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Award, Clock, Tag, ArrowRight, Music, Zap, Users, Dumbbell, Code, Wine, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useDebounce } from '../hooks/useDebounce';
import EventCard from '../components/EventCard';
import EventGridSkeleton from '../components/EventGridSkeleton';

const API_BASE = import.meta.env.VITE_API_BASE;

// TypeScript Interfaces
interface Event {
  id: string;
  title: string;
  location: string;
  image_url?: string | null;
  start_event: string;
  end_event: string;
  category?: string;
  price: number | string;
  status: string;
  available_seats: number;
  total_seats: number;
  createdAt: string;
  description?: string;
  organizer?: {
    id: string;
    full_name: string;
  };
  ratings?: {
    average: number;
    count: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: Event[];
  message?: string;
}

// Category constants
const CATEGORIES = [
  { id: 'semua', label: 'Semua Event', value: '', icon: null },
  { id: 'KONSER', label: 'Konser', value: 'KONSER', icon: Music },
  { id: 'WORKSHOP', label: 'Workshop', value: 'WORKSHOP', icon: Code },
  { id: 'SEMINAR', label: 'Seminar', value: 'SEMINAR', icon: Users },
  { id: 'FESTIVAL', label: 'Festival', value: 'FESTIVAL', icon: Zap },
  { id: 'OLAHRAGA', label: 'Olahraga', value: 'OLAHRAGA', icon: Dumbbell },
  { id: 'LAINNYA', label: 'Lainnya', value: 'LAINNYA', icon: Wine },
];

// Location picker options
const LOCATION_OPTIONS = [
  { label: 'Jakarta', value: 'Jakarta' },
  { label: 'Yogyakarta', value: 'Yogyakarta' },
  { label: 'Bandung', value: 'Bandung' },
  { label: 'Bali', value: 'Bali' },
];

const FILTER_OPTIONS = [
  { id: 'today', label: 'Hari Ini', icon: Clock, value: 'today' },
  { id: 'week', label: 'Minggu Ini', icon: Clock, value: 'week' },
  { id: 'free', label: 'Gratis', icon: Tag, value: 'free' },
];

// Hero Carousel data
const HERO_SLIDES = [
  {
    id: 1,
    headline: 'Mudah & Terpercaya',
    subheadline: 'Booking tiket dalam hitungan menit',
    bgGradient: 'from-orange-500 to-orange-600',
  },
  {
    id: 2,
    headline: 'Ribuan Event Menanti',
    subheadline: 'Temukan event seru di kota Anda',
    bgGradient: 'from-orange-600 to-red-600',
  },
  {
    id: 3,
    headline: 'Kenangan Tak Terlupakan',
    subheadline: 'Buat momen spesial bersama orang terkasih',
    bgGradient: 'from-orange-400 to-orange-500',
  },
];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Location Picker Dropdown State
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Search & Filter State
  const [events, setEvents] = useState<Event[]>([]);
  const [popularEvents, setPopularEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [locationQuery, setLocationQuery] = useState(searchParams.get('location') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'semua');
  const [activeFilters, setActiveFilters] = useState<string[]>(
    searchParams.get('filters')?.split(',').filter(Boolean) || []
  );
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 8;
  
  // Debounce search inputs
  const debouncedSearch = useDebounce(searchQuery.trim(), 500);
  const debouncedLocation = useDebounce(locationQuery.trim(), 500);

  // Hero carousel auto-rotate
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        setCurrentPage(1);

        const params = new URLSearchParams();
        
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (debouncedLocation) params.append('location', debouncedLocation);
        if (selectedCategory !== 'semua') params.append('category', selectedCategory);
        params.append('status', 'ACTIVE');
        params.append('limit', '100');

        console.log('Fetching with params:', params.toString());

        const response = await axios.get<ApiResponse>(
          `${API_BASE}/events?${params.toString()}`
        );

        console.log('API Response:', response.data);
        console.log('Total events received:', response.data.data.length);
        const sampleEvents = response.data.data.slice(0, 5).map(e => ({ 
          title: e.title, 
          price: e.price, 
          priceType: typeof e.price,
          priceZero: e.price === 0,
          priceIsNumber: typeof e.price === 'number'
        }));
        console.log('Sample events with price details:', sampleEvents);
        const freeEvents = response.data.data.filter(e => {
          const price = typeof e.price === 'string' ? parseFloat(e.price) : e.price;
          return !price || price === 0 || price < 0.01;
        });
        console.log('Free events in API response:', freeEvents.length, freeEvents.map(e => ({ title: e.title, price: e.price })));

        if (response.data.success) {
          let filteredEvents = response.data.data;

          // Apply additional filters
          if (activeFilters.includes('today')) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            filteredEvents = filteredEvents.filter(
              (e) => {
                const eventDate = new Date(e.start_event);
                return eventDate >= today && eventDate < tomorrow;
              }
            );
          }

          if (activeFilters.includes('week')) {
            const now = new Date();
            const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            filteredEvents = filteredEvents.filter(
              (e) => new Date(e.start_event) >= now && new Date(e.start_event) <= weekEnd
            );
          }

          if (activeFilters.includes('free')) {
            const beforeFree = filteredEvents.length;
            filteredEvents = filteredEvents.filter((e) => {
              // Handle Decimal from Prisma, string, or number
              let price: any = e.price;
              if (typeof price === 'string') {
                price = parseFloat(price);
              } else if (price && typeof price === 'object') {
                // Handle Decimal object format
                price = parseFloat(String(price));
              } else if (typeof price !== 'number') {
                price = Number(price);
              }
              
              // Return true if price is free
              return !price || price === 0 || isNaN(price);
            });
            console.log(`Free filter: ${beforeFree} → ${filteredEvents.length} events`);
            console.log('Filtered free events:', filteredEvents.map(e => ({ title: e.title, price: e.price })));
          }

          console.log('After filters:', filteredEvents.length);
          setEvents(filteredEvents);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Gagal memuat event. Silakan coba lagi.');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [debouncedSearch, debouncedLocation, selectedCategory, activeFilters]);

  // Fetch popular events
  useEffect(() => {
    const fetchPopularEvents = async () => {
      try {
        const response = await axios.get<ApiResponse>(
          `${API_BASE}/events?status=ACTIVE`
        );
        if (response.data.success) {
          setPopularEvents(response.data.data.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching popular events:', err);
      }
    };

    fetchPopularEvents();
  }, []);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (debouncedLocation) params.set('location', debouncedLocation);
    if (selectedCategory !== 'semua') params.set('category', selectedCategory);
    if (activeFilters.length > 0) params.set('filters', activeFilters.join(','));
    
    setSearchParams(params);
  }, [debouncedSearch, debouncedLocation, selectedCategory, activeFilters, setSearchParams]);

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Toggle filter
  const toggleFilter = (filterId: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterId) ? prev.filter((f) => f !== filterId) : [...prev, filterId]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setSelectedCategory('semua');
    setActiveFilters([]);
  };

  // Handle load more
  const loadMore = async () => {
    setLoadingMore(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setCurrentPage(prev => prev + 1);
    setLoadingMore(false);
  };

  // Pagination
  const paginatedEvents = events.slice(0, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE);
  const hasMore = currentPage < totalPages;

  const hasActiveFilters =
    searchQuery || locationQuery || selectedCategory !== 'semua' || activeFilters.length > 0;

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className="min-h-screen bg-white">
      {/*  HERO CAROUSEL SECTION  */}
      <section className="bg-white pt-4 sm:pt-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <div
            className={`relative bg-gradient-to-r ${slide.bgGradient} rounded-3xl text-white overflow-hidden min-h-72 sm:min-h-80 md:min-h-96 lg:min-h-[500px] flex items-center justify-center transition-all duration-500`}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 400 300">
                <circle cx="50" cy="50" r="30" fill="white" />
                <circle cx="350" cy="250" r="40" fill="white" />
              </svg>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-2 sm:mb-4">
                {slide.headline}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-orange-100 mb-6 sm:mb-8">
                {slide.subheadline}
              </p>
              <button className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-orange-600 font-semibold rounded-full hover:bg-orange-50 transition-colors text-sm sm:text-base cursor-pointer">
                Mulai Sekarang
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
              className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
              className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Pagination dots */}
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {HERO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all cursor-pointer ${
                    idx === currentSlide ? 'bg-white w-8 sm:w-10' : 'bg-white/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/*  EVENT POPULAR SECTION  */}
      <section className="bg-white py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-orange-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Paling Populer</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Event Pilihan</h2>
              </div>
            </div>
            <Link to="/explore" className="text-orange-600 hover:text-orange-700 font-semibold text-sm flex items-center gap-1 transition-colors cursor-pointer">
              Lihat Semua
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularEvents.length > 0 ? (
              popularEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  location={event.location}
                  date_start={event.start_event}
                  category={event.category}
                  price={event.price}
                  image_url={event.image_url}
                  organizer_name={event.organizer?.full_name}
                  rating={event.ratings?.average}
                  review_count={event.ratings?.count}
                />
              ))
            ) : (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[300px]"
                >
                  <div className="text-4xl mb-3">📸</div>
                  <p className="text-gray-600 font-medium">Event Segera Hadir</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/*  PROMOTION BANNER  */}
      <section className="bg-white pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl overflow-hidden min-h-[200px] sm:min-h-[220px] md:min-h-[280px] flex items-center">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6 sm:py-8 md:py-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 lg:gap-10">
                {/* Left content */}
                <div className="flex-1 text-white">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 sm:mb-3 leading-tight">
                    Diskon 50% untuk Event Pertamamu!
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg text-orange-100 mb-4 sm:mb-6">
                    Kode promo: <span className="font-bold text-white">FIRSTEVENT</span>
                  </p>
                  <button className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-white text-orange-600 font-semibold rounded-full hover:bg-orange-50 transition-colors text-xs sm:text-sm md:text-base cursor-pointer">
                    Dapatkan Diskon
                  </button>
                </div>

                {/* Right image placeholder */}
                <div className="hidden md:flex items-center justify-center flex-shrink-0">
                  <div className="w-40 lg:w-48 aspect-square bg-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-6xl lg:text-8xl">🎉</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*  DISCOVERY & FILTERING & MAIN CONTENT  */}
      <section className="bg-white py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Categories Section */}
          <div className="mb-8">
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return cat.id === 'semua' ? (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`flex-shrink-0 px-5 py-2.5 rounded-full font-semibold transition-all text-sm cursor-pointer ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ) : (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className="flex-shrink-0 group cursor-pointer"
                  >
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center transition-all ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'
                    }`}>
                      {Icon && <Icon className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5" />}
                      <span className="text-xs font-semibold text-center leading-tight text-[10px] sm:text-xs">{cat.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Picker Section */}
          <div className="mb-8 relative">
            <button
              onClick={() => setShowLocationPicker(!showLocationPicker)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium text-sm hover:bg-gray-200 transition-all cursor-pointer"
            >
              <span>Cari event di kota</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showLocationPicker ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown menu */}
            {showLocationPicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-56">
                <div className="p-2 space-y-1">
                  {LOCATION_OPTIONS.map((location) => (
                    <button
                      key={location.value}
                      onClick={() => {
                        setLocationQuery(location.value);
                        setShowLocationPicker(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all font-medium text-sm cursor-pointer ${
                        locationQuery === location.value
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {location.label}
                    </button>
                  ))}
                  {locationQuery && (
                    <button
                      onClick={() => {
                        setLocationQuery('');
                        setShowLocationPicker(false);
                      }}
                      className="w-full text-left px-4 py-2 rounded-lg transition-all font-medium text-sm text-orange-600 hover:bg-orange-50 border-t border-gray-200 mt-2 pt-2 cursor-pointer"
                    >
                      Hapus Filter Lokasi
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Additional Filters */}
          <div className="mb-6 flex flex-wrap gap-3">
            {FILTER_OPTIONS.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all text-sm cursor-pointer ${
                    activeFilters.includes(filter.id)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-orange-600 hover:text-orange-700 text-sm font-semibold flex items-center gap-1 mb-8 cursor-pointer"
            >
              ✕ Hapus semua filter
            </button>
          )}

          {/* Results Summary */}
          {!loading && events.length > 0 && (
            <div className="mb-6">
              <p className="text-gray-600 text-sm">
                Menampilkan <span className="font-semibold text-gray-900">1–{Math.min(currentPage * ITEMS_PER_PAGE, events.length)}</span> dari <span className="font-semibold text-gray-900">{events.length}</span> event
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && <EventGridSkeleton count={12} />}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800 font-semibold mb-2">⚠️ Gagal memuat event</p>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition cursor-pointer"
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && events.length === 0 && hasActiveFilters && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Event tidak ditemukan</h3>
              <p className="text-gray-600 mb-6">
                Mohon sesuaikan filter atau gunakan kata kunci pencarian yang berbeda
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition cursor-pointer"
              >
                Lihat semua event
              </button>
            </div>
          )}

          {/* Event Grid */}
          {!loading && events.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {paginatedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    location={event.location}
                    date_start={event.start_event}
                    category={event.category}
                    price={event.price}
                    image_url={event.image_url}
                    organizer_name={event.organizer?.full_name}
                    rating={event.ratings?.average}
                    review_count={event.ratings?.count}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-6">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full disabled:opacity-50 transition-colors text-sm sm:text-base cursor-pointer"
                  >
                    {loadingMore ? (
                      <>
                        <span className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Memuat...</span>
                      </>
                    ) : (
                      <>
                        <span>Jelajah Lebih Banyak Event</span>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
