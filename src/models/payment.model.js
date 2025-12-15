import { DataTypes, Sequelize } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Payment model - NEW TABLE (normalized from orders)
 * Payment information is now stored separately from orders.
 * This allows better tracking of payment transactions and supports
 * multiple payment attempts per order.
 */
const Payment = sequelize.define(
  "Payment",
  {
    payment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "orders",
        key: "order_id",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.ENUM("Cash", "OnlineBanking"),
      allowNull: true,
    },
    payment_status: {
      type: DataTypes.ENUM("Pending", "Completed", "Failed"),
      allowNull: true,
    },
    transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    tableName: "payments",
    timestamps: false,
  }
);

export default Payment;
