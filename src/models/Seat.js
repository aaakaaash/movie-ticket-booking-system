//src/models/Seat.js

export default (sequelize, DataTypes) => {
  return sequelize.define(
    "Seat",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      showId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      seatNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("AVAILABLE", "HELD", "BOOKED"),
        allowNull: false,
        defaultValue: "AVAILABLE",
      },

      heldBy: {
        type: DataTypes.INTEGER, // bookingId
        allowNull: true,
      },

      holdExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "seats",
      timestamps: true,
      indexes: [
        { fields: ["showId"] },
        { fields: ["status"] },
        { fields: ["heldBy"] },
        { fields: ["holdExpiresAt"] },
        {
          unique: true,
          fields: ["showId", "seatNumber"],
        },
      ],
    }
  );
};
