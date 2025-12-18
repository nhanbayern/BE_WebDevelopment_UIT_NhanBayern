import { DataTypes, Sequelize, Op } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Customer model - UPDATED for new schema
 * REMOVED: separate customers_account table
 * NOW: Authentication (login_type, password_hash, google_id) directly in customers table
 * RENAMED: user_id → customer_id, username → customername
 * REMOVED: address field (now in customer_address table)
 */
const Customer = sequelize.define(
  "Customer",
  {
    customer_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
    },
    customername: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    profileimage: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    google_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    login_type: {
      type: DataTypes.ENUM("google", "password"),
      allowNull: false,
      defaultValue: "password",
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "customers",
    timestamps: false,
  }
);

// Associations will be defined in a separate associations file to avoid circular imports
export default Customer;
