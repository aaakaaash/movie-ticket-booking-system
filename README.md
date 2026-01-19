# 🎬 Movie Booking System

A backend system for booking movie tickets with strong guarantees around
concurrency, consistency, and fault tolerance.

---

## 🧩 Overview

This system allows users to:
- View available seats for a show
- Temporarily hold seats
- Confirm bookings
- Cancel bookings
- Automatically release expired seat holds

---

## ⚙️ How the System Works 

**Show Creation**

Shows can be created with a fixed set of seats.

**Seat Listing**

Users can fetch seat details for a specific show.
Each seat exposes its current status:

AVAILABLE

HELD

BOOKED

**Seat Hold (Booking Creation)**

The user initiates a booking by selecting seat IDs.

A Redis distributed lock is acquired for the selected seats to prevent concurrent booking attempts on the same seat set.

Once the lock is acquired:

A database transaction is started.

Selected seats are moved from AVAILABLE → HELD.

A holdExpiresAt timestamp (5 minutes) is assigned.

The transaction is committed and the Redis lock is released.

During the hold window:

Other users cannot select or book the same seats.

Concurrent requests for the same seats are safely rejected.

**Booking Confirmation**

If the user confirms the booking within the hold duration:

Seats transition from HELD → BOOKED

The booking status is updated to CONFIRMED

Confirmation is handled within a database transaction

The confirmation API is idempotent:

Repeated confirmation requests have no side effects.

Already confirmed bookings remain unchanged.

**Seat Release on Expiry**

If the booking is not confirmed within the hold duration:

A background job releases the seats back to AVAILABLE

The booking is marked as EXPIRED

**Manual Booking Cancellation**

Users can explicitly cancel a booking.

All held seats are immediately released.

The booking is marked as CANCELLED.

**System Guarantees**

This flow ensures that:

Seats selected but not booked become available again

Page refreshes or retry requests do not cause inconsistencies

No seat remains locked indefinitely

Concurrent booking attempts are safely handled

## 🏗️ Architecture

- **API Server**: Node.js (Express)
- **Database**: PostgreSQL (transactional consistency)
- **Cache & Distributed Locking**: Redis
- **ORM**: Sequelize
- **Background Jobs**: In-process cron jobs (seat expiry & cleanup)
- **Testing**: Concurrency, expiry, and idempotency tests using Axios

---

## 🔐 Concurrency & Consistency Handling

### Problem
Multiple users may attempt to book the same seats at the same time.

### Solution
- **Redis distributed locks** prevent concurrent seat updates
- **Database row-level locking** ensures consistency
- **Transactions** ensure atomic updates

Only one request can successfully hold or book a seat set at a time.

---

## ⏳ Seat Hold & Expiry Mechanism

### Seat Hold & Expiry Handling

- Seats transition from `AVAILABLE` → `HELD` when a booking is initiated
- Each hold includes a `holdExpiresAt` timestamp
- If the booking is not confirmed before expiry:
  - A background job releases the seats back to `AVAILABLE`
  - The associated booking is marked as `EXPIRED`

This ensures:
- Seats selected but not booked become available again
- Safe handling of user refreshes or retries
- No permanent seat locking or inventory leakage



---

## 🔁 Idempotency (Confirm Booking)

The `confirm booking` API is **idempotent**.

- If a booking is already `CONFIRMED`, repeated confirm requests:
  - Do not throw errors
  - Do not re-book seats
  - Return success silently

This protects the system from:
- Network retries
- Client double-submits
- Payment gateway callbacks

---

## 🧹 Background Jobs

### Seat Expiry Job
- Runs periodically
- Releases expired seat holds
- Marks related bookings as `EXPIRED`

### Booking Cleanup Job
- Removes orphan `PENDING` bookings with no seats attached

These jobs prevent data bloat and stale locks.

---

⚠️ Assumptions

Seat holds expire automatically if not confirmed

One booking can hold multiple seats

Redis is available for locking

🚀 Future Improvements

Background jobs run in-process (single instance) to be managed.

Booking  confirmation should send along with retry queue with once delivery guaranty

 Unit tests (Jest)

Full Dockerization



## ▶️ Running the Project (replace env with valid credentials)

### Option 1: Node.js locally + DBs via Docker (recommended)

Step 1: Start PostgreSQL & Redis

docker-compose up -d

services:
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

Step 2: Install dependencies and start the server

npm install
npm run dev

Step 3: Concurrency test  
(open another terminal)

npm run test:concurrency

Environment variables:

NODE_ENV=TEST
PORT=3000

DB_NAME=movie_booking
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

REDIS_HOST=localhost
REDIS_PORT=6379

---

### Option 2: Node.js + Databases Installed Locally (No Docker)

Step 1: Install PostgreSQL  
Step 2: Install Redis  

Ensure both services are running locally.

Environment variables:

NODE_ENV=TEST
PORT=3000

DB_NAME=movie_booking
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

REDIS_HOST=localhost
REDIS_PORT=6379

Run the application:

npm install
npm run dev

---

### Test Mode
In `NODE_ENV=TEST`, hold duration is reduced (e.g. 10 seconds) to allow faster testing.

## 🧪 Testing Strategy

The project includes:
- Concurrent booking tests
- Idempotency tests
- Expiry handling tests
- Seat statistics validation

Tests simulate real-world race conditions using parallel HTTP requests.

---

