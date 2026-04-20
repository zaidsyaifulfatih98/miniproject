import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Calendar, Star } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE;

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    full_name: string;
  };
  event: {
    id: string;
    title: string;
  };
}

interface OrganizerStats {
  averageRating: number;
  totalReviews: number;
}

interface Event {
  id: string;
  title: string;
  start_event: string;
}

interface Organizer {
  id: string;
  full_name: string;
  email: string;
  address: string;
  createdAt: string;
}

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function OrganizerProfile() {
  const { organizerId } = useParams();
  const navigate = useNavigate();

  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [stats, setStats] = useState<OrganizerStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        // Get organizer info
        const orgRes = await axios.get(`${API_BASE}/users/${organizerId}`);
        setOrganizer(orgRes.data.data);

        // Get organizer stats
        const statsRes = await axios.get(`${API_BASE}/reviews/organizer/${organizerId}/average`);
        setStats(statsRes.data.data);

        // Get organizer reviews
        const reviewsRes = await axios.get(`${API_BASE}/reviews/organizer/${organizerId}?limit=20`);
        setReviews(reviewsRes.data.data || []);

        // Get organizer events
        const eventsRes = await axios.get(`${API_BASE}/events?organizer_id=${organizerId}`);
        setEvents(eventsRes.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Gagal memuat profil organizer');
      } finally {
        setLoading(false);
      }
    };

    if (organizerId) {
      fetchData();
    }
  }, [organizerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Memuat profil organizer...</p>
        </div>
      </div>
    );
  }

  if (error || !organizer) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-8"
          >
            <ArrowLeft size={20} />
            Kembali
          </button>

          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            {error || 'Organizer tidak ditemukan'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Kembali
        </button>

        {/* Header Profile Card */}
        <div className="bg-white border-2 border-orange-200 rounded-lg p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Avatar */}
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl flex-shrink-0 ${getAvatarColor(
                organizer.full_name
              )}`}
            >
              {getInitials(organizer.full_name)}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{organizer.full_name}</h1>

              {/* Rating Badge */}
              {stats && (
                <div className="flex justify-center md:justify-start items-center gap-2 mb-4">
                  <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-semibold flex items-center gap-2">
                    <Star size={18} className="fill-orange-500 text-orange-500" />
                    {stats.averageRating.toFixed(1)} ({stats.totalReviews} ulasan)
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-center md:justify-start items-center gap-2">
                  <Mail size={18} className="text-orange-500" />
                  <span>{organizer.email}</span>
                </div>
                {organizer.address && (
                  <div className="flex justify-center md:justify-start items-center gap-2">
                    <MapPin size={18} className="text-orange-500" />
                    <span>{organizer.address}</span>
                  </div>
                )}
                <div className="flex justify-center md:justify-start items-center gap-2">
                  <Calendar size={18} className="text-orange-500" />
                  <span>Bergabung {new Date(organizer.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-orange-200 rounded-lg p-6">
            <p className="text-gray-600 text-sm mb-1">Total Event</p>
            <p className="text-3xl font-bold text-orange-600">{events.length}</p>
          </div>
          <div className="bg-white border border-orange-200 rounded-lg p-6">
            <p className="text-gray-600 text-sm mb-1">Total Ulasan</p>
            <p className="text-3xl font-bold text-orange-600">{stats?.totalReviews || 0}</p>
          </div>
          <div className="bg-white border border-orange-200 rounded-lg p-6">
            <p className="text-gray-600 text-sm mb-1">Rating Rata-rata</p>
            <p className="text-3xl font-bold text-orange-600">
              {(stats?.averageRating || 0).toFixed(1)}⭐
            </p>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white border border-orange-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ulasan dari Peserta</h2>

          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">Belum ada ulasan</p>
              <p className="text-sm">Bagikan pengalaman Anda setelah menghadiri event ini</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="mb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{review.user.full_name}</p>
                        <p className="text-sm text-gray-500">untuk event: {review.event.title}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={
                              star <= review.rating
                                ? 'fill-orange-400 text-orange-400'
                                : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 text-sm leading-relaxed mt-2">{review.comment}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(review.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Events Section */}
        {events.length > 0 && (
          <div className="bg-white border border-orange-200 rounded-lg p-6 shadow-sm mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Event yang Diselenggarakan</h2>
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-orange-50 p-2 rounded transition"
                  onClick={() => navigate(`/event/${event.id}`)}
                >
                  <Calendar size={20} className="text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.start_event).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
