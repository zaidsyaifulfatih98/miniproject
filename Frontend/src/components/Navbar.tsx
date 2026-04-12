import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Ticket, Search, MapPin, Plus, Compass, Menu, X, LogOut, User, FileText } from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

interface User {
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  role: string[];
  profile_picture?: string;
}

interface Suggestion {
  id: string;
  title: string;
  category?: string;
  location?: string;
  image_url?: string;
}

export default function Navbar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  
  // Search suggestions
  const [searchSuggestions, setSearchSuggestions] = useState<Suggestion[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  
  // Location suggestions
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  
  // Refs for click outside
  const searchRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Check user auth on mount
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, []);

  const handleCreateEventClick = () => {
    if (!user) {
      navigate("/become-organizer");
    } else if (user.role?.includes("ORGANIZER")) {
      navigate("/create-event");
    } else {
      navigate("/become-organizer");
    }
  };

  // Helper: Get user display name
  const getUserDisplayName = (): string => {
    if (user?.name) return user.name;
    if (user?.fullName) return user.fullName;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  // Helper: Generate initials from name
  const getInitials = (fallback: string = "U"): string => {
    const name = getUserDisplayName();
    if (!name) return fallback;
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper: Generate avatar background color based on name
  const getAvatarColor = (fallback: string = "bg-orange-600"): string => {
    const name = getUserDisplayName();
    if (!name) return fallback;
    const colors = [
      "bg-orange-600",
      "bg-orange-500",
      "bg-orange-700",
      "bg-amber-600",
      "bg-rose-600",
      "bg-red-600",
      "bg-orange-400",
      "bg-yellow-600",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsProfileDropdownOpen(false);
    navigate("/");
  };

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isProfileDropdownOpen]);

  // Debounce search suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return;
    }
    
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await axios.get(`${API_BASE}/events`, {
          params: {
            search: searchQuery,
            limit: 5,
            page: 1,
          },
        });
        
        if (response.data.success) {
          setSearchSuggestions(response.data.data);
          setShowSearchSuggestions(true);
        }
      } catch (error) {
        console.error("Error fetching search suggestions:", error);
        setSearchSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounce location suggestions
  useEffect(() => {
    if (!locationQuery.trim()) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }
    
    setLocationLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await axios.get(`${API_BASE}/events/locations`, {
          params: {
            search: locationQuery,
            limit: 5,
          },
        });
        
        if (response.data.success) {
          setLocationSuggestions(response.data.data);
          setShowLocationSuggestions(true);
        }
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
        // Fallback locations if API not available
        const fallbackLocations = [
          "Jakarta", "Bandung", "Surabaya", "Bali", "Yogyakarta",
          "Semarang", "Medan", "Makassar", "Palembang", "Malang"
        ].filter(loc => 
          loc.toLowerCase().includes(locationQuery.toLowerCase())
        );
        setLocationSuggestions(fallbackLocations);
        setShowLocationSuggestions(true);
      } finally {
        setLocationLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [locationQuery]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search submit
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchSuggestions(false);
      navigate(`/explore?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle location submit
  const handleLocationSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (locationQuery.trim()) {
      setShowLocationSuggestions(false);
      navigate(`/explore?location=${encodeURIComponent(locationQuery)}`);
    }
  };

  // Handle suggestion click
  const handleSearchSuggestionClick = (suggestion: Suggestion) => {
    setSearchQuery(suggestion.title);
    setShowSearchSuggestions(false);
    navigate(`/event/${suggestion.id}`);
  };

  // Handle location suggestion click
  const handleLocationSuggestionClick = (location: string) => {
    setLocationQuery(location);
    setShowLocationSuggestions(false);
    navigate(`/explore?location=${encodeURIComponent(location)}`);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-1.5 flex-none">
            <Ticket
              className="w-7 h-7 flex-none"
              style={{ color: "#FF5C2E" }}
            />
            <span
              className="hidden lg:block text-lg font-extrabold tracking-widest uppercase leading-none"
              style={{ color: "#FF5C2E" }}
            >
              LOKAHAJAT
            </span>
          </Link>

          {/* ── Search + Location (desktop) ── */}
          <div className="hidden md:flex flex-1 items-center gap-3">
            {/* Search with suggestions */}
            <div className="relative flex-1" ref={searchRef}>
              <form onSubmit={handleSearchSubmit}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchSuggestions.length > 0) setShowSearchSuggestions(true);
                  }}
                  placeholder="Cari event seru..."
                  className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                />
              </form>
              
              {/* Search Suggestions Dropdown */}
              {showSearchSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
                  {searchLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      <div className="animate-pulse flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  ) : searchSuggestions.length > 0 ? (
                    <>
                      {searchSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSearchSuggestionClick(suggestion)}
                          className="w-full px-4 py-2.5 text-left hover:bg-orange-50 transition-colors flex items-start gap-3 border-b border-gray-100 last:border-0"
                        >
                          {suggestion.image_url ? (
                            <img
                              src={suggestion.image_url}
                              alt={suggestion.title}
                              className="w-10 h-10 rounded-lg object-cover flex-none"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-none">
                              <Ticket className="w-5 h-5 text-orange-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {suggestion.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {suggestion.category && (
                                <span className="text-xs text-gray-500">
                                  {suggestion.category}
                                </span>
                              )}
                              {suggestion.location && (
                                <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {suggestion.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => handleSearchSubmit()}
                        className="w-full px-4 py-2 text-left text-sm font-medium text-orange-600 hover:bg-orange-50 transition-colors border-t border-gray-100"
                      >
                        Lihat semua hasil untuk "{searchQuery}"
                      </button>
                    </>
                  ) : searchQuery.trim() && (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      Tidak ada event ditemukan untuk "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Location with suggestions */}
            <div className="relative w-44 flex-none" ref={locationRef}>
              <form onSubmit={handleLocationSubmit}>
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onFocus={() => {
                    if (locationSuggestions.length > 0) setShowLocationSuggestions(true);
                  }}
                  placeholder="Pilih lokasi..."
                  className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                />
              </form>
              
              {/* Location Suggestions Dropdown */}
              {showLocationSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
                  {locationLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      <div className="animate-pulse flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  ) : locationSuggestions.length > 0 ? (
                    <>
                      {locationSuggestions.map((location, index) => (
                        <button
                          key={index}
                          onClick={() => handleLocationSuggestionClick(location)}
                          className="w-full px-4 py-2.5 text-left hover:bg-orange-50 transition-colors flex items-center gap-2 border-b border-gray-100 last:border-0"
                        >
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{location}</span>
                        </button>
                      ))}
                      <button
                        onClick={() => handleLocationSubmit()}
                        className="w-full px-4 py-2 text-left text-sm font-medium text-orange-600 hover:bg-orange-50 transition-colors border-t border-gray-100"
                      >
                        Lihat semua event di "{locationQuery}"
                      </button>
                    </>
                  ) : locationQuery.trim() && (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      Tidak ada lokasi ditemukan untuk "{locationQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Links (desktop) ── */}
          <div className="hidden md:flex items-center gap-1 flex-none">
            <button
              onClick={handleCreateEventClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Event
            </button>

            <Link
              to="/explore"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-colors"
            >
              <Compass className="w-4 h-4" />
              Jelajah Event
            </Link>

            {/* Auth Section - Desktop */}
            {user ? (
              <div className="relative ml-2" ref={profileDropdownRef}>
                {user.role?.includes("ORGANIZER") ? (
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center justify-center w-11 h-11 rounded-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                    title="Buka Dashboard"
                  >
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span
                        className={`flex items-center justify-center w-full h-full text-white font-extrabold text-lg ${getAvatarColor()}`}
                      >
                        {getInitials()}
                      </span>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className="flex items-center justify-center w-11 h-11 rounded-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                    >
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span
                          className={`flex items-center justify-center w-full h-full text-white font-extrabold text-lg ${getAvatarColor()}`}
                        >
                          {getInitials()}
                        </span>
                      )}
                    </button>

                    {/* Dropdown Menu for Customers */}
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-semibold text-gray-900">{getUserDisplayName()}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>

                        <div className="py-2">
                          <button
                            onClick={() => {
                              navigate("/profile?tab=tickets");
                              setIsProfileDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-2"
                          >
                            <Ticket className="w-4 h-4" />
                            Tiket Saya
                          </button>
                          <button
                            onClick={() => {
                              navigate("/profile?tab=transactions");
                              setIsProfileDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Riwayat Transaksi
                          </button>
                          <button
                            onClick={() => {
                              navigate("/profile");
                              setIsProfileDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-2"
                          >
                            <User className="w-4 h-4" />
                            Profil Saya
                          </button>

                          <div className="border-t border-gray-200 my-2"></div>

                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                          >
                            <LogOut className="w-4 h-4" />
                            Keluar
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/register"
                  className="ml-2 px-5 py-2 rounded-full text-sm font-semibold border-2 text-orange-500 hover:bg-orange-50 transition-colors"
                  style={{ borderColor: "#FF5C2E" }}
                >
                  Daftar
                </Link>

                <Link
                  to="/login"
                  className="px-5 py-2 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#FF5C2E" }}
                >
                  Masuk
                </Link>
              </>
            )}
          </div>

          {/* ── Hamburger (mobile) ── */}
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-colors flex-none"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* ── Mobile Menu ── */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 pt-3 space-y-3 border-t border-gray-100">
            {/* Mobile Search with suggestions */}
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchSuggestions.length > 0) setShowSearchSuggestions(true);
                }}
                placeholder="Cari event seru..."
                className="w-full pl-9 pr-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
              />
              
              {/* Mobile Search Suggestions */}
              {showSearchSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
                  {searchLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Loading...</div>
                  ) : searchSuggestions.length > 0 ? (
                    <>
                      {searchSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => {
                            handleSearchSuggestionClick(suggestion);
                            setIsMenuOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors flex items-center gap-3 border-b border-gray-100"
                        >
                          {suggestion.image_url ? (
                            <img
                              src={suggestion.image_url}
                              alt={suggestion.title}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                              <Ticket className="w-5 h-5 text-orange-500" />
                            </div>
                          )}
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold text-gray-900">
                              {suggestion.title}
                            </p>
                            {suggestion.location && (
                              <p className="text-xs text-gray-500">{suggestion.location}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  ) : null}
                </div>
              )}
            </div>

            {/* Mobile Location */}
            <div className="relative" ref={locationRef}>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onFocus={() => {
                  if (locationSuggestions.length > 0) setShowLocationSuggestions(true);
                }}
                placeholder="Pilih lokasi..."
                className="w-full pl-9 pr-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
              />
              
              {/* Mobile Location Suggestions */}
              {showLocationSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
                  {locationLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Loading...</div>
                  ) : locationSuggestions.length > 0 ? (
                    locationSuggestions.map((location, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          handleLocationSuggestionClick(location);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors flex items-center gap-2 border-b border-gray-100"
                      >
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{location}</span>
                      </button>
                    ))
                  ) : null}
                </div>
              )}
            </div>

            {/* Mobile Links */}
            <div className="flex flex-col gap-1 pt-1">
              <button
                onClick={() => {
                  handleCreateEventClick();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Buat Event
              </button>

              <Link
                to="/explore"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-colors"
              >
                <Compass className="w-4 h-4" />
                Jelajah Event
              </Link>

              {/* Mobile Auth Section */}
              {user ? (
                <div className="border-t border-gray-200 my-2 pt-2">
                  <div className="px-4 py-2 bg-gray-50 rounded-lg mb-2">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>

                  {user.role?.includes("ORGANIZER") ? (
                    <>
                      <button
                        onClick={() => {
                          navigate("/dashboard");
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-colors flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          navigate("/admin");
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-colors flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        Profil
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          navigate("/profile?tab=tickets");
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-colors flex items-center gap-2"
                      >
                        <Ticket className="w-4 h-4" />
                        Tiket Saya
                      </button>
                      <button
                        onClick={() => {
                          navigate("/profile?tab=transactions");
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-colors flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Riwayat Transaksi
                      </button>
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-colors flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        Profil Saya
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 rounded-full text-sm font-semibold border-2 text-orange-500 hover:bg-orange-50 transition-colors"
                    style={{ borderColor: "#FF5C2E" }}
                  >
                    Daftar
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#FF5C2E" }}
                  >
                    Masuk
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}