// src/routes/show.routes.js
import express from "express";
import { createShow, getShow,getShowBookings } from "../controllers/show.controller.js";

const router = express.Router();

// POST /api/shows - Create new show
router.post("/shows", createShow);

// GET /api/shows/:showId - Get show details
router.get("/shows/:showId", getShow);

// GET /api/shows/:showId - Get booking details of a show
router.get("/shows/:showId/bookings", getShowBookings);


export default router;
