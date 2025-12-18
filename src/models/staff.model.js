import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Staff model - NEW TABLE
 * Separate authentication for staff members
 */
const Staff = sequelize.define(
  "Staff",
  {
    staff_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
    },
    profileimg: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    login_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    staff_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "staff",
    timestamps: false,
  }
);

export default Staff;
