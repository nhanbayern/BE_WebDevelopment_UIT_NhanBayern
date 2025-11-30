import sequelize from "../config/db.js";
import { Sequelize, DataTypes } from "sequelize";
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
    },
    cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    sale_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    manufacturer_id: {
      type: DataTypes.STRING(10),
      allowNull: false,
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
