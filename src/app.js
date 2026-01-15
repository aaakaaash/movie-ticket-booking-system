// src/app.js 
import "dotenv/config";
import express from "express";
import seatRoutes from "./routes/seat.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import showRoutes from "./routes/show.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());

// Mount routes
app.use("/api", seatRoutes);
app.use("/api", bookingRoutes);
app.use("/api", showRoutes);

app.use(errorMiddleware);

export default app;