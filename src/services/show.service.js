// src/services/show.service.js
import db from "../models/index.js";
import AppError from "../utils/AppError.js";

/**
 * Create show with seats
 */
export async function createShowWithSeats(data) {
  const { showTime, totalSeats } = data;

  if (!showTime || !totalSeats) {
    throw new AppError("showTime and totalSeats are required", 400);
  }

  
  const transaction = await db.sequelize.transaction();

  try {
    // Create show
    const show = await db.Show.create(
      { showTime, totalSeats },
      { transaction }
    );

    // Create seats for the show
    const seats = Array.from({ length: totalSeats }, (_, i) => ({
      showId: show.id,
      seatNumber: i + 1,
    }));

    await db.Seat.bulkCreate(seats, { transaction });

    await transaction.commit();

    return show;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * Get show with seat statistics
 */
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

  // Get seat statistics
  const seatStats = await db.Seat.findAll({
    where: { showId },
    attributes: [
      "status",
      [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
    ],
    group: ["status"],
    raw: true,
  });

  const seatStatistics = {
    available: 0,
    held: 0,
    booked: 0,
  };

  seatStats.forEach((stat) => {
    const count = parseInt(stat.count);
    if (stat.status === "AVAILABLE") seatStatistics.available = count;
    if (stat.status === "HELD") seatStatistics.held = count;
    if (stat.status === "BOOKED") seatStatistics.booked = count;
  });

  return { show, seatStatistics };
}

export async function getBookingsByShow(showId, status) {
  return db.Booking.findAll({
    where: { showId, ...(status && { status }) },
    include: [{ model: db.Seat, as: "seats",required:true }],
  });
}
