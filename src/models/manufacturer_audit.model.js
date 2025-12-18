import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * ManufacturerAudit model - NEW TABLE (inferred from schema requirements)
 * Tracks manufacturer updates by staff
 */
const ManufacturerAudit = sequelize.define(
  "ManufacturerAudit",
  {
    audit_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    manufacturer_id: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: "manufacturers",
        key: "manufacturer_id",
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
      type: DataTypes.ENUM("CREATE", "UPDATE", "DELETE"),
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
    tableName: "manufacturer_audit",
    timestamps: false,
  }
);

export default ManufacturerAudit;
