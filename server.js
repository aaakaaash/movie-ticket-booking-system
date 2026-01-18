
import app from "./src/app.js";
import db from "./src/models/index.js";
import { connectDB } from "./src/config/db.js";
import { connectRedis } from "./src/config/redis.js";
import {
  startSeatExpiryJob,
  setupGracefulShutdown,
} from "./src/jobs/seatExpiry.job.js";

import { startBookingCleanupJob } from "./src/jobs/bookingCleanup.job.js";


const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // 1️⃣ Connect to PostgreSQL
    await connectDB();

    // 2️⃣ Connect to Redis
    await connectRedis();

    // 3️⃣ Sync models
    await db.sequelize.sync({ alter: true });

    // 4️⃣ Start background job
    startSeatExpiryJob();
    startBookingCleanupJob(); 

    // 5️⃣ Setup graceful shutdown
    setupGracefulShutdown();

    // 6️⃣ Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server", error);
    process.exit(1);
  }
})();