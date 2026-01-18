// src/services/seat.service.js
import { Op } from "sequelize";
import db from "../models/index.js";

/**
 * Release expired seats (background job)
 */
export async function releaseExpiredSeats() {
  const now = new Date();

  try {
    // Release expired held seats
    const [releasedSeats] = await db.Seat.update(
      {
        status: "AVAILABLE",
        heldBy: null,
        holdExpiresAt: null,
      },
      {
        where: {
          status: "HELD",
          holdExpiresAt: { [Op.lt]: now },
        },
      }
    );

    // Mark bookings as expired
    const expiredBookingIds = await db.Seat.findAll({
      attributes: ["heldBy"],
      where: {
        status: "AVAILABLE",
        heldBy: { [Op.not]: null },
      },
      group: ["heldBy"],
      raw: true,
    });

    if (expiredBookingIds.length > 0) {
      await db.Booking.update(
        { status: "EXPIRED" },
        {
          where: {
            id: expiredBookingIds.map((b) => b.heldBy),
            status: "PENDING",
          },
        }
      );
    }

    console.log(
      `✅ Released ${releasedSeats} expired seats at ${now.toISOString()}`
    );
  } catch (error) {
    console.error("❌ Error releasing expired seats:", error);
  }
}

/**
 * Get seat statistics for a show
 */
export async function getSeatStatistics(showId) {
  const stats = await db.Seat.findAll({
    where: { showId },
    attributes: [
      "status",
      [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
    ],
    group: ["status"],
    raw: true,
  });

  const result = {
    available: 0,
    held: 0,
    booked: 0,
    total: 0,
  };

  stats.forEach((stat) => {
    const count = parseInt(stat.count);
    result.total += count;
    
    if (stat.status === "AVAILABLE") result.available = count;
    if (stat.status === "HELD") result.held = count;
    if (stat.status === "BOOKED") result.booked = count;
  });

  return result;
}

export async function fetchSeatsForShow(showId) {
  // Ensure show exists
  const showExists = await db.Show.findByPk(showId, {
    attributes: ["id"],
  });

  if (!showExists) {
    throw new AppError("Show not found", 404);
  }

  // Release expired seat holds
  await releaseExpiredSeats(showId);

  // Fetch seats
  const seats = await db.Seat.findAll({
    where: { showId },
    order: [["seatNumber", "ASC"]],
    attributes: ["id", "seatNumber", "status", "holdExpiresAt"],
  });

  return seats;
}
