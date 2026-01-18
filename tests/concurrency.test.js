// tests/concurrency.test.js
import axios from "axios";

const BASE_URL = "http://localhost:3000/api";

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// ==============================================
// Test 1: Concurrent booking attempts
// ==============================================
async function testConcurrentBooking() {
  log("\n" + "=".repeat(60), colors.cyan);
  log("TEST 1: Concurrent Booking Attempts", colors.cyan);
  log("=".repeat(60), colors.cyan);
  log("Three users trying to book the same seats simultaneously\n");

  const payload = {
    showId: 1,
    seatIds: [1,2,3],
  };

  const results = await Promise.allSettled([
    axios.post(`${BASE_URL}/bookings`, payload),
    axios.post(`${BASE_URL}/bookings`, payload),
    axios.post(`${BASE_URL}/bookings`, payload),
  ]);

  let successCount = 0;
  let failureCount = 0;

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successCount++;
      log(
        `✅ Request ${index + 1}: SUCCESS - Booking ID: ${result.value.data.data.bookingId}`,
        colors.green
      );
    } else {
      failureCount++;
      log(
        `❌ Request ${index + 1}: FAILED - ${result.reason.response?.data?.message || result.reason.message}`,
        colors.red
      );
    }
  });

  log(
    `\n📊 Results: ${successCount} succeeded, ${failureCount} failed`,
    colors.yellow
  );
  log(
    `✅ Expected: Only 1 success (concurrent safety working)`,
    successCount === 1 ? colors.green : colors.red
  );
}

// ==============================================
// Test 2: Rapid sequential bookings
// ==============================================
async function testRapidSequentialBooking() {
  log("\n" + "=".repeat(60), colors.cyan);
  log("TEST 2: Rapid Sequential Bookings", colors.cyan);
  log("=".repeat(60), colors.cyan);
  log("Same user making rapid booking requests\n");

  const bookingIds = [];

  for (let i = 0; i < 3; i++) {
    try {
      const response = await axios.post(`${BASE_URL}/bookings`, {
        showId: 1,
        seatIds: [5 + i],
      });
      bookingIds.push(response.data.data.bookingId);
      log(
        `✅ Booking ${i + 1}: SUCCESS - Booking ID: ${response.data.data.bookingId}`,
        colors.green
      );
    } catch (error) {
      log(
        `❌ Booking ${i + 1}: FAILED - ${error.response?.data?.message}`,
        colors.red
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  log(`\n📊 Created ${bookingIds.length} bookings successfully`, colors.yellow);
  return bookingIds;
}

// ==============================================
// Test 3: Idempotency - Retry logic
// ==============================================
async function testIdempotency() {
  log("\n" + "=".repeat(60), colors.cyan);
  log("TEST 3: Idempotency Test (Simulating Retries)", colors.cyan);
  log("=".repeat(60), colors.cyan);
  log("User refreshing/retrying booking request\n");

  // First booking
  const firstResponse = await axios.post(`${BASE_URL}/bookings`, {
    showId: 1,
    seatIds: [11, 12],
  });

  const bookingId = firstResponse.data.data.bookingId;
  log(
    `✅ Initial booking created: ${bookingId}`,
    colors.green
  );

  // Simulate retry with same seats
  try {
    await axios.post(`${BASE_URL}/bookings`, {
      showId: 1,
      seatIds: [11, 12],
    });
    log(`❌ Retry should have failed but succeeded!`, colors.red);
  } catch (error) {
    log(
      `✅ Retry correctly blocked: ${error.response?.data?.message}`,
      colors.green
    );
  }
}

async function testConfirmIdempotency() {
  log("\n=== TEST: Confirm Idempotency ===", colors.cyan);

  // 1️⃣ Create booking
  const res = await axios.post(`${BASE_URL}/bookings`, {
    showId: 1,
    seatIds: [15, 16],
  });

  const bookingId = res.data.data.bookingId;
  log(`✅ Booking created: ${bookingId}`, colors.green);

  // 2️⃣ Confirm booking first time
  await axios.post(`${BASE_URL}/bookings/${bookingId}/confirm`);
  log(`✅ First confirmation succeeded`, colors.green);

  // 3️⃣ Confirm booking again (retry)
  try {
    await axios.post(`${BASE_URL}/bookings/${bookingId}/confirm`);
    log(`✅ Retry confirmation succeeded silently (idempotent)`, colors.green);
  } catch (error) {
    log(`❌ Retry confirmation failed: ${error.response?.data?.message}`, colors.red);
  }
}


// ==============================================
// Test 4: Confirm after hold expires
// ==============================================
async function testExpiredConfirmation() {
  log("\n" + "=".repeat(60), colors.cyan);
  log("TEST 4: Confirming Expired Hold", colors.cyan);
  log("=".repeat(60), colors.cyan);
  log("Attempting to confirm booking after hold expires ( 10 seconds wait for env=TEST)\n");

  const response = await axios.post(`${BASE_URL}/bookings`, {
    showId: 1,
    seatIds: [19, 20],
  });

  const bookingId = response.data.data.bookingId;
  log(`✅ Booking created: ${bookingId}`, colors.green);
  log(`⏳ Waiting 11 seconds (simulating expiry)...`, colors.yellow);

  await new Promise((resolve) => setTimeout(resolve, 11000));

  try {
    await axios.post(`${BASE_URL}/bookings/${bookingId}/confirm`);
    log(`❌ Confirmation should have failed!`, colors.red);
  } catch (error) {
    log(
      `✅ Expired confirmation correctly blocked: ${error.response?.data?.message}`,
      colors.green
    );
  }
}

// ==============================================
// Test 5: Seat statistics
// ==============================================
async function testSeatStatistics() {
  log("\n" + "=".repeat(60), colors.cyan);
  log("TEST 5: Seat Statistics", colors.cyan);
  log("=".repeat(60), colors.cyan);

  const response = await axios.get(`${BASE_URL}/shows/1/seats/stats`);
  const stats = response.data.data;

  log(`📊 Seat Statistics for Show 1:`, colors.blue);
  log(`   Total Seats: ${stats.total}`);
  log(`   Available: ${stats.available}`, colors.green);
  log(`   Held: ${stats.held}`, colors.yellow);
  log(`   Booked: ${stats.booked}`, colors.cyan);
}

// ==============================================
// Test 6: Cancel booking
// ==============================================
async function testCancelBooking(bookingId) {
  log("\n" + "=".repeat(60), colors.cyan);
  log("TEST 6: Cancel Booking", colors.cyan);
  log("=".repeat(60), colors.cyan);

  try {
    await axios.delete(`${BASE_URL}/bookings/${bookingId}`);
    log(`✅ Booking ${bookingId} cancelled successfully`, colors.green);

    // Verify seats are available again
    const statsResponse = await axios.get(`${BASE_URL}/shows/1/seats/stats`);
    log(`📊 Updated stats:`, colors.blue);
    log(`   Available: ${statsResponse.data.data.available}`, colors.green);
  } catch (error) {
    log(`❌ Cancel failed: ${error.response?.data?.message}`, colors.red);
  }
}

// ==============================================
// Run all tests
// ==============================================
async function runAllTests() {
  log("\n🚀 Starting Concurrency Tests...\n", colors.cyan);

  try {
    await testConcurrentBooking();
    const bookingIds = await testRapidSequentialBooking();
    await testIdempotency();
    await testConfirmIdempotency();
    await testSeatStatistics();

    if (bookingIds.length > 0) {
      await testCancelBooking(bookingIds[0]);
    }

    // Uncomment to test expiry (takes 5+ seconds)
    await testExpiredConfirmation();

    log("\n" + "=".repeat(60), colors.cyan);
    log("✅ All tests completed!", colors.green);
    log("=".repeat(60) + "\n", colors.cyan);
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, colors.red);
    console.error(error);
  }
}

// Run tests
runAllTests();