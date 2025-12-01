import { DataTypes, Sequelize } from "sequelize";
import sequelize from "../config/db.js";

const EmailOTP = sequelize.define(
  "EmailOTP",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    otp_type: {
      type: DataTypes.ENUM(
        "register",
        "forgot_password",
        "change_email",
        "2fa"
      ),
      allowNull: true,
      defaultValue: "register",
    },
    otp_hash: { type: DataTypes.STRING(255), allowNull: false },
    expired_at: { type: DataTypes.DATE, allowNull: false },
    attempt_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    max_attempts: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 5 },
    resend_count: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    resend_at: { type: DataTypes.DATE, allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    user_agent: { type: DataTypes.STRING(255), allowNull: true },
    device_fingerprint: { type: DataTypes.STRING(255), allowNull: true },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      onUpdate: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    tableName: "emailotp", // match actual MySQL table name (lowercase)
    timestamps: false,
  }
);

export default EmailOTP;
