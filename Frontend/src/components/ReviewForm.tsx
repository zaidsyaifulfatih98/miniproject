import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../i18n/LanguageContext';

const API_BASE = import.meta.env.VITE_API_BASE;

interface ReviewFormProps {
  eventId: string;
  bookingId: string;
  hasUserReview?: boolean;
  onReviewSubmitted?: () => void;
}

export default function ReviewForm({
  eventId,
  bookingId,
  hasUserReview = false,
  onReviewSubmitted,
}: ReviewFormProps) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError(t('reviewForm.selectRatingFirst'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_BASE}/reviews`,
        {
          event_id: eventId,
          booking_id: bookingId,
          rating,
          comment: comment.trim() || undefined,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess(true);
        setRating(0);
        setComment('');
        onReviewSubmitted?.();
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        t('reviewForm.submitFailedDefault');
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-orange-200 p-6 shadow-md overflow-hidden">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{t('reviewForm.heading')}</h3>
      </div>

      {hasUserReview ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 font-medium flex items-center justify-center gap-2">
            <span className="text-lg">✓</span> {t('reviewForm.alreadyReviewed')}
          </p>
        </div>
      ) : (
        <>
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              ✅ {t('reviewForm.submitSuccess')}
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Rating Stars */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('reviewForm.ratingLabel')}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={`${
                        star <= (hoveredRating || rating)
                          ? 'fill-orange-400 text-orange-400'
                          : 'text-gray-300'
                      } transition`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-orange-600 mt-2 font-medium">{t('reviewForm.ratingOutOf', { rating })}</p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('reviewForm.commentLabel')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder={t('reviewForm.commentPlaceholder')}
                maxLength={500}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('reviewForm.charCount', { count: comment.length })}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || rating === 0}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Send size={18} />
              {isLoading ? t('reviewForm.sending') : t('reviewForm.submitButton')}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
