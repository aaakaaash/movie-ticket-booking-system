//src/models/index.js

import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";

import ShowModel from "./Show.js";
import SeatModel from "./Seat.js";
import BookingModel from "./Booking.js";

const db = {};

db.sequelize = sequelize;

db.Show = ShowModel(sequelize, DataTypes);
db.Seat = SeatModel(sequelize, DataTypes);
db.Booking = BookingModel(sequelize, DataTypes);

// Relationships
db.Show.hasMany(db.Seat, { foreignKey: "showId" });
db.Seat.belongsTo(db.Show, { foreignKey: "showId" });

db.Show.hasMany(db.Booking, { foreignKey: "showId" });
db.Booking.belongsTo(db.Show, { foreignKey: "showId" });

db.Booking.hasMany(db.Seat, { 
  foreignKey: "heldBy",
  as: "seats" 
});
db.Seat.belongsTo(db.Booking, { 
  foreignKey: "heldBy",
  as: "booking"
});

export default db;
