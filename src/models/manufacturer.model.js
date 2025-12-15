import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Manufacturer model - NEW TABLE
 * Manufacturers are now stored in a separate normalized table
 * instead of being embedded in products.
 */
const Manufacturer = sequelize.define(
  "Manufacturer",
  {
    manufacturer_id: {
      type: DataTypes.STRING(10),
      primaryKey: true,
    },
    manufacturer_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    province: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "manufacturers",
    timestamps: false,
  }
);

export default Manufacturer;
