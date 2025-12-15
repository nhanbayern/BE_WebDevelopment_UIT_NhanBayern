import sequelize from "../config/db.js";
import { Sequelize, DataTypes } from "sequelize";

/**
 * Product model - UPDATED to match new schema
 * Added: category, region, origin, long_description fields
 * manufacturer_id now references the new manufacturers table
 */
const Product = sequelize.define(
  "Product",
  {
    product_id: {
      type: DataTypes.STRING(10),
      primaryKey: true,
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    alcohol_content: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
    },
    volume_ml: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    packaging_spec: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // NEW: Added long_description field
    long_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // NEW: Added origin field with default
    origin: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: "Việt Nam",
    },
    cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    sale_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    // NEW: Added category field
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // NEW: Added region field
    region: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    manufacturer_id: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: "manufacturers",
        key: "manufacturer_id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "products",
    timestamps: false, // vì DB đã có created_at, updated_at sẵn
  }
);

export default Product;
