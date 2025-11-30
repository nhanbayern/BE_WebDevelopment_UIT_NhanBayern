import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";

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
    payment_method: {
      type: DataTypes.ENUM("Cash", "OnlineBanking"),
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.ENUM("Unpaid", "Paid"),
      allowNull: true,
      defaultValue: "Unpaid",
    },
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
