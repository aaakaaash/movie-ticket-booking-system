// src/controllers/booking.controller.js
import {
  holdSeats,
  confirmBookingService,
  releaseSeats,
  getBookingDetails,
} from "../services/booking.service.js";
import AppError from "../utils/AppError.js";

export async function createBooking(req, res, next) {
  try {
    const { showId, seatIds } = req.body;

    if (!showId || !Array.isArray(seatIds) || seatIds.length === 0) {
      throw new AppError("showId and seatIds array are required", 400);
    }

    const result = await holdSeats(showId, seatIds);

    res.status(201).json({
      success: true,
      message: "Seats held successfully",
      data: {
        bookingId: result.booking.id,
        showId: result.booking.showId,
        status: result.booking.status,
        seatIds: result.seatIds,
        holdExpiresAt: result.holdExpiresAt,
        expiresIn: "5 minutes",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getBooking(req, res, next) {
  try {
    const { bookingId } = req.params;

    const booking = await getBookingDetails(bookingId);

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    res.json({
      success: true,
      message: "Booking fetched successfully",
      data: booking,
    });
  } catch (err) {
    next(err);
  }
}

export async function confirmBooking(req, res, next) {
  try {
    const { bookingId } = req.params;

    await confirmBookingService(bookingId);

    res.json({
      success: true,
      message: "Booking confirmed successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const { bookingId } = req.params;

    await releaseSeats(bookingId);

    res.json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (err) {
    next(err);
  }
}