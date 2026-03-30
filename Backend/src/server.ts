import express from "express";
import userRouter from "./routers/user.router";
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173", // blog web
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}))

app.use("/api/users", userRouter);


// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.message);
  res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});