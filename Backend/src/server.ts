import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.ORIGIN_PORT || "http://localhost:5173,http://localhost:5174")
      .split(",")
      .map((o) => o.trim());
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith(".vercel.app")) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

const app = express();
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

try {
  const userRouter = require("./routers/user.router").default;
  const eventRouter = require("./routers/event.router").default;
  const ticketRouter = require("./routers/ticket.router").default;
  const promoRouter = require("./routers/promo.router").default;
  const bookingRouter = require("./routers/booking.router").default;
  const reviewRouter = require("./routers/review.router").default;
  const { initializeBookingSchedulers } = require("./schedulers/booking.scheduler");

  app.use("/api/users", userRouter);
  app.use("/api/events", eventRouter);
  app.use("/api/tickets", ticketRouter);
  app.use("/api/promos", promoRouter);
  app.use("/api/bookings", bookingRouter);
  app.use("/api/reviews", reviewRouter);

  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.message);
    res.status(500).json({ success: false, message: err.message });
  });

  if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      initializeBookingSchedulers();
    });
  }
} catch (err: any) {
  console.error("STARTUP CRASH:", err.message, err.stack);
  app.use((req: express.Request, res: express.Response) => {
    res.status(500).json({ success: false, message: "Server startup failed", error: err.message });
  });
}

module.exports = app;
