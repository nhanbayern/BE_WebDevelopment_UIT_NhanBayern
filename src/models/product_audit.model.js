import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * ProductAudit model - NEW TABLE
 * Tracks all product create/update/delete operations by staff
 */
const ProductAudit = sequelize.define(
  "ProductAudit",
  {
    audit_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: "products",
        key: "product_id",
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
    tableName: "product_audit",
    timestamps: false,
  }
);

export default ProductAudit;
