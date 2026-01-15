import { createClient } from "redis";

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

client.on("connect", () => {
  console.log("✅ Redis connected");
});

client.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

export const connectRedis = async () => {
  try {
    await client.connect();
  } catch (error) {
    console.error("❌ Redis connection failed:", error.message);
    process.exit(1);
  }
};

export default client;
