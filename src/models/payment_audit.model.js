import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * PaymentAudit model - NEW TABLE
 * Tracks payment status updates by staff
 */
const PaymentAudit = sequelize.define(
  "PaymentAudit",
  {
    audit_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "payments",
        key: "payment_id",
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
      type: DataTypes.ENUM("Pending", "Completed", "Failed"),
      allowNull: true,
    },
    new_status: {
      type: DataTypes.ENUM("Pending", "Completed", "Failed"),
      allowNull: true,
    },
    action_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "payment_audit",
    timestamps: false,
  }
);

export default PaymentAudit;
