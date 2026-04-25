import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Star, User } from 'lucide-react';

interface EventCardProps {
  id: string;
  title: string;
  location: string;
  date_start: string;
  category?: string;
  price?: number | string;
  image_url?: string | null;
  organizer_name?: string | null;
  organizer_id?: string;
  rating?: number;
  review_count?: number;
}

function formatPrice(price?: number | string): string {
  if (price === undefined || price === null) return 'GRATIS';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return 'GRATIS';
  if (numPrice === 0 || numPrice < 0.01) return 'GRATIS';
  return 'Rp ' + Math.floor(numPrice).toLocaleString('id-ID');
}

export default function EventCard({
  id,
  title,
  location,
  date_start,
  category,
  price,
  image_url,
  organizer_name,
  rating = 0,
  review_count = 0,
}: EventCardProps) {
  const [imgError, setImgError] = useState(false);

  const eventDate = new Date(date_start).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link to={`/events/${id}`} className="cursor-pointer">
      <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 h-full flex flex-col cursor-pointer">
        {/* Image */}
        <div className="relative w-full aspect-video bg-gray-200 overflow-hidden">
          {image_url && !imgError ? (
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
              <span className="text-gray-600 text-sm">📸 Event Image</span>
            </div>
          )}
          {category && (
            <span className="absolute top-3 right-3 px-2.5 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
              {category}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 flex flex-col flex-1">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 hover:text-orange-500 transition-colors text-sm sm:text-base">
            {title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-gray-600 text-xs sm:text-sm mb-2">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>{eventDate}</span>
          </div>

          {/* Organizer */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">
            <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="line-clamp-1">{organizer_name || 'Unknown Organizer'}</span>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-2 sm:pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-orange-500 text-sm sm:text-base">
              {formatPrice(price)}
            </span>
            {review_count > 0 ? (
              <div className="flex items-center gap-1 ml-auto">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-xs sm:text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
              </div>
            ) : (
              <span className="text-[10px] sm:text-xs text-gray-500 ml-auto">Belum ada review</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
