// src/routes/booking.routes.js
import express from "express";
import {
  createBooking,
  confirmBooking,
  cancelBooking,
  getBooking,
} from "../controllers/booking.controller.js";

const router = express.Router();

// POST /api/bookings - Create new booking (temporarily hold seats before confirm booking )
router.post("/bookings", createBooking);

// GET /api/bookings/:bookingId - Get booking details
router.get("/bookings/:bookingId", getBooking);

// POST /api/bookings/:bookingId/confirm - Confirm booking
router.post("/bookings/:bookingId/confirm", confirmBooking);

// DELETE /api/bookings/:bookingId - Cancel/release booking
router.delete("/bookings/:bookingId", cancelBooking);

export default router;