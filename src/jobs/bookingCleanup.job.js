// src/jobs/bookingCleanup.job.js
import db from "../models/index.js";

let intervalId = null;

export async function cleanupOrphanBookings() {
  try {
    await db.sequelize.query(`
      DELETE FROM bookings
      WHERE status = 'PENDING'
      AND id NOT IN (
        SELECT DISTINCT "heldBy"
        FROM seats
        WHERE "heldBy" IS NOT NULL
      )
    `);

    console.log("🧹 Orphan PENDING bookings cleaned up");
  } catch (err) {
    console.error("❌ Error cleaning orphan bookings:", err);
  }
}

/**
 * Start booking cleanup job
 * Runs every 1 minute
 */
export function startBookingCleanupJob() {
  if (intervalId) {
    console.log("⚠️ Booking cleanup job already running");
    return;
  }

  console.log("🕐 Starting booking cleanup job...");

  // Run once immediately
  cleanupOrphanBookings();

  // Then every 1 minute
  intervalId = setInterval(() => {
    cleanupOrphanBookings();
  }, 60 * 1000);

  console.log("✅ Booking cleanup job started (runs every 1 minute)");
}

/**
 * Stop job (for graceful shutdown)
 */
export function stopBookingCleanupJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("🛑 Booking cleanup job stopped");
  }
}
