import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const LoginLog = sequelize.define(
  "LoginLog",
  {
    log_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // session_id to link login_logs with refresh_tokens.session_id
    session_id: { type: DataTypes.INTEGER, allowNull: true },
    // account_id length increased to match customers_account.account_id (STRING(30))
    account_id: { type: DataTypes.STRING(30), allowNull: true },
    input_username: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    username: { type: DataTypes.STRING(50), allowNull: false },
    ip_address: { type: DataTypes.STRING(45), allowNull: false },
    user_agent: { type: DataTypes.STRING(255), allowNull: true },
    login_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    logout_time: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM("success", "failed", "logout"),
      allowNull: false,
    },
    error_message: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "login_logs",
    timestamps: false,
  }
);

export default LoginLog;
