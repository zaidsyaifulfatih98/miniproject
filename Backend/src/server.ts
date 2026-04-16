import "dotenv/config";
import express from "express";
import userRouter from "./routers/user.router";
import eventRouter from "./routers/event.router";
import ticketRouter from "./routers/ticket.router";
import promoRouter from "./routers/promo.router";
import bookingRouter from "./routers/booking.router";
import cors from 'cors';
import { initializeBookingSchedulers } from "./schedulers/booking.scheduler";

const app = express();
const PORT = process.env.PORT || 8000;
const ORIGIN_PORT = process.env.ORIGIN_PORT

app.use(express.json());
app.use(cors({
  origin: ORIGIN_PORT, // blog web
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}))

app.use("/api/users", userRouter);
app.use("/api/events", eventRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/promos", promoRouter);
app.use("/api/bookings", bookingRouter);


// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.message);
  res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initializeBookingSchedulers();
});