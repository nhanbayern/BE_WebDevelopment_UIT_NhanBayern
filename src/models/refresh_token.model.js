import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const RefreshToken = sequelize.define(
  "RefreshToken",
  {
    session_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    token_hash: { type: DataTypes.STRING(255), allowNull: false },
    user_id: { type: DataTypes.STRING(20), allowNull: false },
    device_info: { type: DataTypes.STRING(255), allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    revoked: { type: DataTypes.BOOLEAN, defaultValue: false },
    revoked_at: { type: DataTypes.DATE, allowNull: true },
    last_used_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "refresh_tokens",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
export default RefreshToken;
