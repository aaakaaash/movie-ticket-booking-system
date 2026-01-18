// src/services/booking.service.js
import { Op } from "sequelize";
import db from "../models/index.js";
import redisClient  from "../config/redis.js";
import AppError from "../utils/AppError.js";

const HOLD_DURATION_MS = process.env.NODE_ENV === "TEST"
    ? 10000
    : 5 * 60 * 1000;// 5 minutes
const LOCK_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Acquire distributed lock using Redis
 */
async function acquireLock(lockKey, timeout = LOCK_TIMEOUT_MS) {
  const lockValue = Date.now().toString();
  const result = await redisClient.set(lockKey, lockValue, {
    PX: timeout,
    NX: true,
  });
  return result === "OK" ? lockValue : null;
}

/**
 * Release distributed lock
 */
async function releaseLock(lockKey, lockValue) {
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  
  try {
    await redisClient.eval(script, {
      keys: [lockKey],
      arguments: [lockValue],
    });
  } catch (error) {
    console.error("Error releasing lock:", error);
  }
}

/**
 * Hold seats with distributed locking for concurrency safety
 */
export async function holdSeats(showId, seatIds) {
  const show = await db.Show.findByPk(showId);

  if (!show) {
    throw new AppError("Show not found", 404);
  }

  const now = new Date();


  if (now >= show.showTime) {
    throw new AppError("Show has already started", 400);
  }

  // Create lock key for the specific seats
  const sortedSeatIds = [...seatIds].sort((a, b) => a - b);
  const lockKey = `lock:show:${showId}:seats:${sortedSeatIds.join(",")}`;

  let lockValue = null;
  
  try {
    // Acquire lock with retry logic
    let retries = 3;
    while (retries > 0 && !lockValue) {
      lockValue = await acquireLock(lockKey, LOCK_TIMEOUT_MS);
      if (!lockValue) {
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    if (!lockValue) {
      throw new AppError(
        "Unable to acquire lock. Another booking is in progress for these seats.",
        409
      );
    }

    // Start database transaction
    const transaction = await db.sequelize.transaction();

    try {
      // Create booking record
      const booking = await db.Booking.create(
        { showId, status: "PENDING" },
        { transaction }
      );

      const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);

      // Update seats with row-level locking
      const [updated] = await db.Seat.update(
        {
          status: "HELD",
          heldBy: booking.id,
          holdExpiresAt: expiresAt,
        },
        {
          where: {
            id: seatIds,
            showId,
            status: "AVAILABLE",
          },
          transaction,
        }
      );

        if (updated !== seatIds.length) {
        await db.Booking.destroy({
         where: { id: booking.id },
        transaction,
        });
        throw new AppError("Seats unavailable", 409);
        }


      await transaction.commit();

      return {
        booking,
        seatIds,
        holdExpiresAt: expiresAt,
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } finally {
    // Always release lock
    if (lockValue) {
      await releaseLock(lockKey, lockValue);
    }
  }
}

/**
 * Confirm booking - mark seats as BOOKED
 */
export async function confirmBookingService(bookingId) {
  const transaction = await db.sequelize.transaction();

  try {
    const booking = await db.Booking.findByPk(bookingId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.status === "CONFIRMED") {
    await transaction.commit();
    return;
    }

    if (booking.status !== "PENDING") {
      throw new AppError(
        `Cannot confirm booking with status: ${booking.status}`,
        400
      );
    }

    // Check if hold has expired
    const seats = await db.Seat.findAll({
      where: {
        heldBy: bookingId,
        status: "HELD",
      },
      transaction,
    });

    if (seats.length === 0) {
      throw new AppError(
        "No held seats found. The hold may have expired.",
        400
      );
    }

    // Check expiry
    const now = new Date();
    if (seats[0].holdExpiresAt < now) {
      throw new AppError("Booking hold has expired", 400);
    }

    // Update seats to BOOKED
await db.Seat.update(
  { status: "BOOKED" },
  {
    where: { heldBy: bookingId },
    transaction,
  }
);



    // Update booking status
    booking.status = "CONFIRMED";
    await booking.save({ transaction });

    await transaction.commit();

    // send notificaiton to user with the required details using any queue service like bullmq, sqs ...
    
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * Release seats manually (cancel booking)
 */
export async function releaseSeats(bookingId) {
  const transaction = await db.sequelize.transaction();

  try {
    const booking = await db.Booking.findByPk(bookingId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.status === "CONFIRMED") {
      throw new AppError("Cannot cancel a confirmed booking", 400);
    }

    // Release seats
    await db.Seat.update(
      {
        status: "AVAILABLE",
        heldBy: null,
        holdExpiresAt: null,
      },
      {
        where: {
          heldBy: bookingId,
          status: "HELD",
        },
        transaction,
      }
    );

    // Update booking status
    booking.status = "CANCELLED";
    await booking.save({ transaction });

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * Get booking details with seats
 */
export async function getBookingDetails(bookingId) {
  const booking = await db.Booking.findByPk(bookingId, {
    include: [
      {
        model: db.Show,
        attributes: ["id", "showTime", "totalSeats"],
      },
      {
        model: db.Seat,
        as: "seats", // Use the alias defined in models/index.js
        attributes: ["id", "seatNumber", "status"],
        requied:true
      },
    ],
  });

  if (!booking) {
    return null;
  }

  return {
    id: booking.id,
    showId: booking.showId,
    status: booking.status,
    seats: booking.seats.map((s) => ({
      id: s.id,
      seatNumber: s.seatNumber,
      status: s.status,
    })),
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    show: booking.Show,
  };
}