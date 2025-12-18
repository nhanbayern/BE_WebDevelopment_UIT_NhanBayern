import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * CustomerAudit model - NEW TABLE
 * Tracks customer updates by staff
 */
const CustomerAudit = sequelize.define(
  "CustomerAudit",
  {
    audit_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: "customers",
        key: "customer_id",
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
    action: {
      type: DataTypes.ENUM("UPDATE"),
      allowNull: false,
    },
    old_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    new_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    action_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "customer_audit",
    timestamps: false,
  }
);

export default CustomerAudit;
