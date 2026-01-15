// src/jobs/seatExpiry.job.js
import { releaseExpiredSeats } from "../services/seat.service.js";

let intervalId = null;

/**
 * Start background job to release expired seats
 * Runs every 30 seconds
 */
export function startSeatExpiryJob() {
  if (intervalId) {
    console.log("⚠️  Seat expiry job is already running");
    return;
  }

  console.log("🕐 Starting seat expiry background job...");

  // Run immediately on start
  releaseExpiredSeats();

  // Then run every 30 seconds
  intervalId = setInterval(() => {
    releaseExpiredSeats();
  }, 30 * 1000);

  console.log("✅ Seat expiry job started (runs every 30 seconds)");
}

/**
 * Stop background job
 */
export function stopSeatExpiryJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("🛑 Seat expiry job stopped");
  }
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown() {
  const signals = ["SIGTERM", "SIGINT"];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      stopSeatExpiryJob();
      process.exit(0);
    });
  });
}

