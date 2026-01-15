// src/routes/show.routes.js
import express from "express";
import { createShow, getShow } from "../controllers/show.controller.js";

const router = express.Router();

// POST /api/shows - Create new show
router.post("/shows", createShow);

// GET /api/shows/:showId - Get show details
router.get("/shows/:showId", getShow);

export default router;
