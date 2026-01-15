// src/services/show.service.js
import db from "../models/index.js";
import AppError from "../utils/AppError.js";

export async function createShowWithSeats({ showTime, totalSeats }) {
  if (!showTime || !totalSeats) {
    throw new AppError("showTime and totalSeats are required", 400);
  }

  return db.sequelize.transaction(async (t) => {
    const show = await db.Show.create(
      { showTime, totalSeats },
      { transaction: t }
    );

    const seats = Array.from({ length: totalSeats }, (_, i) => ({
      showId: show.id,
      seatNumber: i + 1,
    }));

    await db.Seat.bulkCreate(seats, { transaction: t });

    return show;
  });
}

export async function getShowWithSeatStats(showId) {
  if (!showId) {
    throw new AppError("showId is required", 400);
  }

  const show = await db.Show.findByPk(showId, {
    attributes: ["id", "showTime", "totalSeats", "createdAt"],
  });

  if (!show) {
    throw new AppError("Show not found", 404);
  }

  const seatStats = await db.Seat.findAll({
    where: { showId },
    attributes: [
      "status",
      [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
    ],
    group: ["status"],
    raw: true,
  });

  const stats = { available: 0, held: 0, booked: 0 };

  seatStats.forEach(({ status, count }) => {
    stats[status.toLowerCase()] = parseInt(count);
  });

  return { show, seatStatistics: stats };
}
