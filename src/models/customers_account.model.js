import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const CustomersAccount = sequelize.define(
  "CustomersAccount",
  {
    account_id: { type: DataTypes.STRING(30), primaryKey: true },
    user_id: { type: DataTypes.STRING(20), allowNull: false },
    login_type: { type: DataTypes.ENUM("google", "password"), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: true, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: true },
    google_id: { type: DataTypes.STRING(50), allowNull: true, unique: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "customers_account",
    timestamps: false,
  }
);

export default CustomersAccount;
