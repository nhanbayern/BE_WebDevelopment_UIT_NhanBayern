import { DataTypes, Sequelize } from "sequelize";
import sequelize from "../config/db.js";

const UserAddress = sequelize.define(
  "UserAddress",
  {
    address_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: "customers",
        key: "user_id",
      },
    },
    address_line: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ward: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    district: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    province: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    is_default: {
      type: DataTypes.TINYINT(1),
      defaultValue: 0,
      allowNull: true,
    },
    address_code: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
    },
  },
  {
    tableName: "user_address",
    timestamps: false, // Table doesn't have created_at/updated_at
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["user_id", "is_default"],
      },
      {
        unique: true,
        fields: ["address_code"],
      },
    ],
  }
);

export default UserAddress;
