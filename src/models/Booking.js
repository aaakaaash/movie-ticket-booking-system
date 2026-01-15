//src/models/Booking.js

export default (sequelize, DataTypes) => {
  return sequelize.define(
    "Booking",
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

      status: {
        type: DataTypes.ENUM(
          "PENDING",
          "CONFIRMED",
          "EXPIRED",
          "CANCELLED"
        ),
        allowNull: false,
        defaultValue: "PENDING",
      },
    },
    {
      tableName: "bookings",
      timestamps: true,
      indexes: [{ fields: ["showId"] }, { fields: ["status"] }],
    }
  );
};
