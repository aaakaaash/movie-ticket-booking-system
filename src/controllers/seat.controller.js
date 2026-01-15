// src/controllers/seat.controller.js
import { getSeatStatistics } from "../services/seat.service.js";
import db from "../models/index.js";
import AppError from "../utils/AppError.js";
import { Op } from "sequelize";

export async function getSeats(req, res, next) {
  try {
    const { showId } = req.params;

    if (!showId) {
      throw new AppError("showId is required", 400);
    }

    // Release expired holds before fetching
    await releaseExpiredSeatsSync(showId);

    const seats = await db.Seat.findAll({
      where: { showId },
      order: [["seatNumber", "ASC"]],
      attributes: ["id", "seatNumber", "status", "holdExpiresAt"],
    });

    res.json({
      success: true,
      message: "Seats fetched successfully",
      data: seats,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSeatStats(req, res, next) {
  try {
    const { showId } = req.params;

    if (!showId) {
      throw new AppError("showId is required", 400);
    }

    // Release expired holds before calculating stats
    await releaseExpiredSeatsSync(showId);

    const stats = await getSeatStatistics(showId);

    res.json({
      success: true,
      message: "Seat statistics fetched successfully",
      data: stats,
    });
  } catch (err) {
    next(err);
  }
}

// Helper function to release expired seats synchronously
async function releaseExpiredSeatsSync(showId) {
  const now = new Date();

  await db.Seat.update(
    {
      status: "AVAILABLE",
      heldBy: null,
      holdExpiresAt: null,
    },
    {
      where: {
        showId,
        status: "HELD",
        holdExpiresAt: { [Op.lt]: now },
      },
    }
  );
}