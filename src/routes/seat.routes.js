
// src/routes/seat.routes.js
import express from "express";
import { getSeats, getSeatStats } from "../controllers/seat.controller.js";

const router = express.Router();

// GET /api/shows/:showId/seats - Get all seats for a show
router.get("/shows/:showId/seats", getSeats);

// GET /api/shows/:showId/seats/stats - Get seat statistics
router.get("/shows/:showId/seats/stats", getSeatStats);

export default router;