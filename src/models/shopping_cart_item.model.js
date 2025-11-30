import { DataTypes, Sequelize } from "sequelize";
import sequelize from "../config/db.js";

const ShoppingCartItem = sequelize.define(
  "ShoppingCartItem",
  {
    item_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: "customers",
        key: "user_id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    product_id: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: "products",
        key: "product_id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      onUpdate: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    tableName: "shopping_cart_item",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "product_id"],
        name: "unique_user_product",
      },
    ],
  }
);

export default ShoppingCartItem;
