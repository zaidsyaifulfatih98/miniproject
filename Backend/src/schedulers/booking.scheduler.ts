import cron from 'node-cron';
import { checkAndExpireBookings, checkAndCancelPendingConfirmations } from '../services/rollback.service';

export function initializeBookingSchedulers() {
  // check and expire bookings (2-hour rule)
  cron.schedule('0 * * * *', async () => {
    try {
      await checkAndExpireBookings();
    } catch (error) {
      console.error('Error in checkAndExpireBookings:', error);
    }
  });

  // cancel pending confirmations (3-day rule)
  cron.schedule('30 * * * *', async () => {
    try {
      await checkAndCancelPendingConfirmations();
    } catch (error) {
      console.error('Error in checkAndCancelPendingConfirmations:', error);
    }
  });
}
