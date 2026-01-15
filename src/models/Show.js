//src/models/show.js

export default (sequelize, DataTypes) => {
  return sequelize.define(
    "Show",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      showTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      totalSeats: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "shows",
      timestamps: true,
      indexes: [{ fields: ["showTime"] }],
    }
  );
};
