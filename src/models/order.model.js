import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";

/**
 * Order model - UPDATED for normalized schema
 * REMOVED: payment_method, payment_status (now in payments table)
 * Payment info is now stored in the separate payments table and
 * accessed via the 'payment' association or virtual getters.
 */
const Order = sequelize.define(
  "Order",
  {
    order_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    customer_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    recipient_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    recipient_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    shipping_address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    shipping_partner: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "Local",
    },
    order_status: {
      type: DataTypes.ENUM("Preparing", "On delivery", "Delivered"),
      allowNull: true,
      defaultValue: "Preparing",
    },
    // NOTE: payment_method and payment_status have been moved to the payments table
    // Virtual getters below provide backward compatibility for API responses
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    final_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    tableName: "orders",
    timestamps: false,
  }
);

export default Order;
