import { Star, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/LanguageContext';
import { translations } from '../i18n';

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
}

interface ReviewsListProps {
  reviews: Review[];
  averageRating?: number;
  totalReviews?: number;
  onReviewDeleted?: () => void;
  showDeleteButton?: boolean;
  currentUserId?: string;
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
    'bg-red-400',
    'bg-blue-400',
    'bg-green-400',
    'bg-purple-400',
    'bg-yellow-400',
    'bg-pink-400',
    'bg-indigo-400',
    'bg-teal-400',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

function formatDate(dateString: string, language: Language): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const ns = translations[language].reviewsList;

  if (diffDays === 0) return ns.today;
  if (diffDays === 1) return ns.yesterday;
  if (diffDays < 7) return ns.daysAgo.replace('{{count}}', String(diffDays));
  if (diffDays < 30) return ns.weeksAgo.replace('{{count}}', String(Math.floor(diffDays / 7)));

  return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ReviewsList({
  reviews,
  averageRating = 0,
  totalReviews = 0,
  onReviewDeleted,
  showDeleteButton = false,
  currentUserId,
}: ReviewsListProps) {
  const { t, language } = useLanguage();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleDelete = async (reviewId: string) => {
    if (!confirm(t('reviewsList.confirmDelete'))) return;

    setIsDeleting(reviewId);
    setError('');

    try {
      const response = await axios.delete(`${API_BASE}/reviews/${reviewId}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        onReviewDeleted?.();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('reviewsList.deleteFailedDefault'));
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header dengan Rating */}
      {totalReviews > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-white border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">{averageRating.toFixed(1)}</div>
              <div className="flex justify-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={
                      star <= Math.round(averageRating)
                        ? 'fill-orange-400 text-orange-400'
                        : 'text-gray-300'
                    }
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {t('reviewsList.basedOn')} <span className="font-semibold text-gray-900">{totalReviews}</span>{' '}
                {t('reviewsList.reviewsWord')}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ⚠️ {error}
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{t('reviewsList.noReviews')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              {/* Reviewer Info */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(
                      review.user.full_name
                    )}`}
                  >
                    {getInitials(review.user.full_name)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{review.user.full_name}</p>
                    <p className="text-xs text-gray-500">{formatDate(review.createdAt, language)}</p>
                  </div>
                </div>

                {showDeleteButton && currentUserId === review.user.id && (
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={isDeleting === review.id}
                    className="text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                    title={t('reviewsList.deleteReviewTitle')}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {/* Rating Stars */}
              <div className="flex gap-0.5 mb-2">
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

              {/* Comment */}
              {review.comment && (
                <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
