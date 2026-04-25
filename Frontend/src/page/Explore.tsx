import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Tag,
  Wifi,
  X,
  SlidersHorizontal,
  Music,
  Code,
  Users,
  Zap,
  Dumbbell,
  Wine,
} from "lucide-react";
import EventCard from "../components/EventCard";
import EventGridSkeleton from "../components/EventGridSkeleton";

const API_BASE = import.meta.env.VITE_API_BASE;
const PAGE_SIZE = 12;

// ─── Types ────
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
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Constants ────
const CATEGORIES = [
  { id: "semua", label: "Semua Event", value: "", icon: null },
  { id: "KONSER", label: "Konser", value: "KONSER", icon: Music },
  { id: "WORKSHOP", label: "Workshop", value: "WORKSHOP", icon: Code },
  { id: "SEMINAR", label: "Seminar", value: "SEMINAR", icon: Users },
  { id: "FESTIVAL", label: "Festival", value: "FESTIVAL", icon: Zap },
  { id: "OLAHRAGA", label: "Olahraga", value: "OLAHRAGA", icon: Dumbbell },
  { id: "LAINNYA", label: "Lainnya", value: "LAINNYA", icon: Wine },
];

const LOCATION_OPTIONS = [
  { label: "Jakarta", value: "Jakarta" },
  { label: "Yogyakarta", value: "Yogyakarta" },
  { label: "Bandung", value: "Bandung" },
  { label: "Bali", value: "Bali" },
];

const FILTER_OPTIONS = [
  { id: "today", label: "Hari Ini", value: "today" },
  { id: "week", label: "Minggu Ini", value: "week" },
  { id: "free", label: "Gratis", value: "free" },
];

const SORT_OPTIONS = [
  { label: "Terbaru", value: "latest" },
  { label: "Terlama", value: "oldest" },
  { label: "Harga Terendah", value: "price_asc" },
  { label: "Harga Tertinggi", value: "price_desc" },
];

// ─── Sidebar Filter Section ────
function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pb-4 mb-4 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0">
      <button
        className="flex items-center justify-between w-full text-sm font-bold text-gray-900 mb-3 hover:text-orange-500 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {title}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="space-y-2.5">{children}</div>}
    </div>
  );
}

// ─── Pagination Component ────
function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-orange-500 hover:text-orange-500 disabled:opacity-50 transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={`page-${p}`}
            onClick={() => onChange(p as number)}
            className={`w-10 h-10 rounded-full border-2 text-sm font-bold transition-all ${
              p === page
                ? "bg-orange-500 text-white border-orange-500"
                : "border-gray-300 text-gray-700 hover:border-orange-500 hover:text-orange-500"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-orange-500 hover:text-orange-500 disabled:opacity-50 transition-all"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main Component ────
export default function Explore() {
  const [searchParams] = useSearchParams();

  // Filter States
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    searchParams.get("location")?.split(",").filter(Boolean) || [],
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("category")?.split(",").filter(Boolean) || [],
  );
  const [activeFilters, setActiveFilters] = useState<string[]>(
    searchParams.get("filters")?.split(",").filter(Boolean) || [],
  );
  const [isOnline, setIsOnline] = useState(false);
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Data States
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset filters
  useEffect(() => {
    setPage(1);
  }, [selectedLocations, selectedCategories, activeFilters, isOnline, sort]);

  // Build API params
  const buildParams = useCallback(() => {
    const params: Record<string, any> = {
      status: "ACTIVE",
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedLocations.length > 0)
      params.location = selectedLocations.join(",");
    if (selectedCategories.length > 0)
      params.category = selectedCategories.join(",");
    if (isOnline) params.type = "online";
    if (activeFilters.includes("free")) params.price = 0;
    if (activeFilters.includes("today")) params.filter = "today";
    if (activeFilters.includes("week")) params.filter = "week";
    params.page = page;
    params.limit = PAGE_SIZE;
    params.sort = sort;
    return params;
  }, [
    debouncedSearch,
    selectedLocations,
    selectedCategories,
    isOnline,
    activeFilters,
    page,
    sort,
  ]);

  // Fetch events
  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get<ApiResponse>(`${API_BASE}/events`, { params: buildParams() })
      .then((res) => {
        console.log("API Response:", res.data);
        if (res.data.success) {
          setEvents(res.data.data);
          setTotal(res.data.meta?.total ?? res.data.data.length);
          setTotalPages(res.data.meta?.totalPages ?? 1);
          console.log(
            "Events:",
            res.data.data.length,
            "Total:",
            res.data.meta?.total,
          );
        } else {
          setError(res.data.message || "Gagal memuat event");
        }
      })
      .catch((err) => {
        console.error("API Error:", err);
        setError("Gagal memuat event. Pastikan server berjalan.");
      })
      .finally(() => setLoading(false));
  }, [buildParams]);

  // Helpers
  const toggleLocation = (loc: string) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc],
    );
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const toggleFilter = (value: string) => {
    setActiveFilters((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value],
    );
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedLocations([]);
    setSelectedCategories([]);
    setActiveFilters([]);
    setIsOnline(false);
    setSort("latest");
    setPage(1);
  };

  const activeFilterCount =
    (search ? 1 : 0) +
    selectedLocations.length +
    selectedCategories.length +
    activeFilters.length +
    (isOnline ? 1 : 0);

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gray-200 flex-none">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-gray-900 text-sm">Filter</span>
            {activeFilterCount > 0 && (
              <span className="ml-auto w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content - with proper scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Cari event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-300 focus:border-orange-500 outline-none text-sm"
            />
          </div>

          {/* Filter Sections */}
          <FilterSection title="Lokasi">
            {LOCATION_OPTIONS.map((loc) => (
              <label
                key={loc.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(loc.value)}
                  onChange={() => toggleLocation(loc.value)}
                  className="w-4 h-4 rounded border-2 border-gray-300 text-orange-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700">{loc.label}</span>
              </label>
            ))}
          </FilterSection>

          <FilterSection title="Kategori">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.value)}
                  onChange={() => toggleCategory(cat.value)}
                  className="w-4 h-4 rounded border-2 border-gray-300 text-orange-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700">{cat.label}</span>
              </label>
            ))}
          </FilterSection>

          <FilterSection title="Tipe Event">
            {FILTER_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={activeFilters.includes(opt.value)}
                  onChange={() => toggleFilter(opt.value)}
                  className="w-4 h-4 rounded border-2 border-gray-300 text-orange-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </FilterSection>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isOnline}
              onChange={(e) => setIsOnline(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-gray-300 text-orange-500 cursor-pointer"
            />
            <Wifi className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">Event Online</span>
          </label>

          {/* Reset Button */}
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="w-full py-2 rounded-xl border-2 border-gray-300 text-sm font-bold text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-1.5"
            >
              <X className="w-3 h-3" />
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 md:py-10">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-orange-500 border-b-2 border-orange-500 pb-1">
            🔍 Jelajahi Event
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mt-2">
            Temukan Event Terbaik
          </h1>
        </div>

        <div className="flex gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border-2 border-gray-900 shadow-lg overflow-hidden flex flex-col">
              {/* Sidebar Header */}
              <div className="px-4 py-4 border-b-2 border-gray-200 flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-500" />
                <span className="font-bold text-gray-900">Filter Event</span>
                {activeFilterCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
                {/* Search */}
                <div>
                  <input
                    type="text"
                    placeholder="Cari event..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-300 focus:border-orange-500 outline-none text-sm"
                  />
                </div>

                {/* Filter Sections */}
                <FilterSection title="Lokasi">
                  {LOCATION_OPTIONS.map((loc) => (
                    <label
                      key={loc.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(loc.value)}
                        onChange={() => toggleLocation(loc.value)}
                        className="w-4 h-4 rounded border-2 border-gray-300 text-orange-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{loc.label}</span>
                    </label>
                  ))}
                </FilterSection>

                <FilterSection title="Kategori">
                  {CATEGORIES.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.value)}
                        onChange={() => toggleCategory(cat.value)}
                        className="w-4 h-4 rounded border-2 border-gray-300 text-orange-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{cat.label}</span>
                    </label>
                  ))}
                </FilterSection>

                <FilterSection title="Tipe Event">
                  {FILTER_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={activeFilters.includes(opt.value)}
                        onChange={() => toggleFilter(opt.value)}
                        className="w-4 h-4 rounded border-2 border-gray-300 text-orange-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </FilterSection>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOnline}
                    onChange={(e) => setIsOnline(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-gray-300 text-orange-500 cursor-pointer"
                  />
                  <Wifi className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Event Online</span>
                </label>

                {/* Reset Button */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="w-full py-2 rounded-xl border-2 border-gray-300 text-sm font-bold text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3 h-3" />
                    Reset Filter
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Top Bar: Filter Button + Result Count + Sort */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 flex-wrap md:flex-nowrap">
              {/* Filter Button (Mobile) */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="md:hidden flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-gray-300 text-xs font-bold text-gray-700 hover:border-orange-500 hover:text-orange-500 transition-all flex-none"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Result Count */}
              <p className="hidden md:block text-xs md:text-sm text-gray-600 flex-1">
                {loading ? (
                  <span className="inline-block h-4 w-48 bg-gray-200 rounded animate-pulse" />
                ) : error ? null : total === 0 ? (
                  "Event tidak ditemukan"
                ) : (
                  <>
                    Menampilkan{" "}
                    <span className="font-bold text-gray-900">
                      {startItem}–{endItem}
                    </span>{" "}
                    dari{" "}
                    <span className="font-bold text-gray-900">{total}</span>{" "}
                    event
                  </>
                )}
              </p>

              {/* Sort Dropdown */}
              <div className="relative flex-none ml-auto md:ml-0">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="px-4 py-2.5 pr-10 rounded-xl border-2 border-gray-300 text-xs font-bold text-gray-700 hover:border-orange-500 focus:border-orange-500 outline-none transition-all appearance-none bg-white"
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Active Filters Tags */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {search && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                    "{search}"
                    <button onClick={() => setSearch("")}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedLocations.map((loc) => (
                  <span
                    key={loc}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold"
                  >
                    {loc}
                    <button onClick={() => toggleLocation(loc)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold"
                  >
                    {cat}
                    <button onClick={() => toggleCategory(cat)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {activeFilters.map((filter) => (
                  <span
                    key={filter}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold"
                  >
                    {FILTER_OPTIONS.find((f) => f.value === filter)?.label}
                    <button onClick={() => toggleFilter(filter)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {isOnline && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                    Online
                    <button onClick={() => setIsOnline(false)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12 text-red-600 font-bold border-2 border-dashed border-red-300 rounded-2xl">
                ⚠️ {error}
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && !error && (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <EventGridSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && events.length === 0 && (
              <div className="text-center py-16">
                <p className="text-2xl font-bold text-gray-400 mb-2">
                  📭 Event Tidak Ditemukan
                </p>
                <p className="text-gray-500 mb-6">
                  Coba ubah filter atau kata kunci pencarian
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2 rounded-xl border-2 border-orange-500 text-orange-500 font-bold hover:bg-orange-50 transition-all"
                >
                  Reset Semua Filter
                </button>
              </div>
            )}

            {/* Event Grid + Pagination */}
            {!loading && !error && events.length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {events.map((event) => (
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
                      organizer_id={event.organizer?.id}
                      rating={event.ratings?.average}
                      review_count={event.ratings?.count}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={(p) => {
                      setPage(p);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
