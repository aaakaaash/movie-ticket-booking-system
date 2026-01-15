// src/controllers/show.controller.js
import {
  createShowWithSeats,
  getShowWithSeatStats,
} from "../services/show.service.js";

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
