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
const PORT = process.env.PORT;
const allowedOrigins = (process.env.ORIGIN_PORT || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

console.log("Allowed CORS origins:", allowedOrigins);

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Fallback: allow any vercel.app subdomain
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Handle preflight requests
app.options("*", cors());

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

// For local development
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initializeBookingSchedulers();
  });
}

// Export for Vercel serverless
module.exports = app;