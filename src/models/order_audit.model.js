import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * OrderAudit model - NEW TABLE
 * Tracks order status updates by staff
 */
const OrderAudit = sequelize.define(
  "OrderAudit",
  {
    audit_id: {
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
    staff_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: "staff",
        key: "staff_id",
      },
    },
    old_status: {
      type: DataTypes.ENUM("Preparing", "On delivery", "Delivered", "Cancelled"),
      allowNull: true,
    },
    new_status: {
      type: DataTypes.ENUM("Preparing", "On delivery", "Delivered", "Cancelled"),
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    action_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "order_audit",
    timestamps: false,
  }
);

export default OrderAudit;
