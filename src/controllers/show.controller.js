// src/controllers/show.controller.js
import {
  createShowWithSeats,
  getShowWithSeatStats,
  getBookingsByShow
} from "../services/show.service.js";

import { fetchSeatsForShow } from "../services/seat.service.js";

export async function createShow(req, res, next) {
  try {
    const show = await createShowWithSeats(req.body);

    res.status(201).json({
      success: true,
      message: "Show created successfully",
      data: { showId: show.id },
    });
  } catch (err) {
    next(err);
  }
}

export async function getShow(req, res, next) {
  try {
    const { showId } = req.params;
    const { show, seatStatistics } = await getShowWithSeatStats(showId);

    res.json({
      success: true,
      message: "Show fetched successfully",
      data: {
        id: show.id,
        showTime: show.showTime,
        totalSeats: show.totalSeats,
        createdAt: show.createdAt,
        seatStatistics,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getShowSeats(req, res, next) {
  try {
    const { showId } = req.params;

    if (!showId) {
      throw new AppError("showId is required", 400);
    }

    const seats = await fetchSeatsForShow(showId);

    res.status(200).json({
      success: true,
      message: "Seats fetched successfully",
      data: seats,
    });
  } catch (err) {
    next(err);
  }
}

export async function getShowBookings(req, res) {
  const { showId } = req.params;
  const { status } = req.query;

      if (!showId) {
      throw new AppError("showId is required", 400);
    }
    
  const bookings = await getBookingsByShow(showId, status);

  res.json({ success: true,
    message:"Booking fetched successfully",
     data: bookings });
}
