import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Staff Refresh Token Model
 * Stores refresh tokens for staff authentication
 */
const StaffRefreshToken = sequelize.define(
  "StaffRefreshToken",
  {
    session_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    staff_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: "staff",
        key: "staff_id",
      },
    },
    device_info: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "staff_refresh_tokens",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default StaffRefreshToken;
