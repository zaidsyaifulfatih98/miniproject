import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/review.service';
import { validate } from '../middlewares/validate.middleware';
import { createReviewSchema, updateReviewSchema } from '../schemas/review.schema';
import { AuthRequest } from '../middlewares/auth.middleware';

export const reviewController = {
  async createReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { event_id, booking_id, rating, comment } = req.body;

      try {
        const review = await reviewService.createReview(userId, {
          event_id,
          booking_id,
          rating,
          comment,
        });

        res.status(201).json({
          success: true,
          message: 'Review berhasil dibuat',
          data: review,
        });
      } catch (error: any) {
        const message = error.message || 'Gagal membuat review';

        let statusCode = 400;
        if (
          message.includes('belum selesai') ||
          message.includes('status DONE') ||
          message.includes('tidak ditemukan')
        ) {
          statusCode = 403;
        }

        res.status(statusCode).json({
          success: false,
          message: message,
        });
        return;
      }
    } catch (error) {
      next(error);
    }
  },

  async getReviewsByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.eventId as string;

      const reviews = await reviewService.getReviewsByEvent(eventId);

      res.status(200).json({
        success: true,
        message: 'Reviews retrieved successfully',
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  },

  async getReviewsByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;

      const reviews = await reviewService.getReviewsByUser(userId);

      res.status(200).json({
        success: true,
        message: 'User reviews retrieved successfully',
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  },

  async getReviewById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const review = await reviewService.getReviewById(id);

      if (!review) {
        res.status(404).json({
          success: false,
          message: 'Review tidak ditemukan',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Review retrieved successfully',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = req.params.id as string;
      const { rating, comment } = req.body;

      try {
        const review = await reviewService.updateReview(id, userId, {
          rating,
          comment,
        });

        res.status(200).json({
          success: true,
          message: 'Review updated successfully',
          data: review,
        });
      } catch (error: any) {
        if (error.message.includes('tidak memiliki akses')) {
          res.status(403).json({
            success: false,
            message: error.message,
          });
          return;
        }

        if (error.message.includes('tidak ditemukan')) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
          return;
        }

        throw error;
      }
    } catch (error) {
      next(error);
    }
  },

  async deleteReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = req.params.id as string;

      try {
        await reviewService.deleteReview(id, userId);

        res.status(200).json({
          success: true,
          message: 'Review deleted successfully',
        });
      } catch (error: any) {
        if (error.message.includes('tidak memiliki akses')) {
          res.status(403).json({
            success: false,
            message: error.message,
          });
          return;
        }

        if (error.message.includes('tidak ditemukan')) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
          return;
        }

        throw error;
      }
    } catch (error) {
      next(error);
    }
  },

  async getOrganizerAverageRating(req: Request, res: Response, next: NextFunction) {
    try {
      const organizerId = req.params.organizerId as string;

      const stats = await reviewService.getOrganizerAverageRating(organizerId);

      res.status(200).json({
        success: true,
        message: 'Organizer rating retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  async getReviewsByOrganizer(req: Request, res: Response, next: NextFunction) {
    try {
      const organizerId = req.params.organizerId as string;
      const { limit } = req.query;

      const reviews = await reviewService.getReviewsByOrganizer(
        organizerId,
        limit ? parseInt(limit as string) : 10
      );

      res.status(200).json({
        success: true,
        message: 'Organizer reviews retrieved successfully',
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  },

  async getEventWithReviewStats(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.eventId as string;

      const eventData = await reviewService.getEventWithReviewStats(eventId);

      res.status(200).json({
        success: true,
        message: 'Event with reviews retrieved successfully',
        data: eventData,
      });
    } catch (error: any) {
      if (error.message.includes('tidak ditemukan')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      next(error);
    }
  },
};
