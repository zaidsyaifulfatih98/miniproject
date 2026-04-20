import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { validate } from '../middlewares/validate.middleware';
import { createReviewSchema, updateReviewSchema } from '../schemas/review.schema';
import { authenticateToken } from '../middlewares/auth.middleware';

const reviewRouter = Router();

reviewRouter.post(
  '/',
  authenticateToken,
  validate(createReviewSchema),
  reviewController.createReview
);

reviewRouter.get('/event/:eventId', reviewController.getReviewsByEvent);
reviewRouter.get('/event/:eventId/with-stats', reviewController.getEventWithReviewStats);
reviewRouter.get('/user/:userId', reviewController.getReviewsByUser);
reviewRouter.get('/organizer/:organizerId/average', reviewController.getOrganizerAverageRating);
reviewRouter.get('/organizer/:organizerId', reviewController.getReviewsByOrganizer);
reviewRouter.get('/:id', reviewController.getReviewById);

reviewRouter.put(
  '/:id',
  authenticateToken,
  validate(updateReviewSchema),
  reviewController.updateReview
);

reviewRouter.delete('/:id', authenticateToken, reviewController.deleteReview);

export default reviewRouter;
