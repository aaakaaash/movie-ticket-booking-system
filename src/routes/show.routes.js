// src/routes/show.routes.js
import express from "express";
import { createShow, getShow, getShowSeats,getShowBookings } from "../controllers/show.controller.js";

const router = express.Router();

// POST /api/shows - Create new show
router.post("/shows", createShow);

// GET /api/shows/:showId - Get show details
router.get("/shows/:showId", getShow);

router.get("/shows/:showId/seats", getShowSeats);

router.get("/shows/:showId/bookings", getShowBookings);


export default router;
