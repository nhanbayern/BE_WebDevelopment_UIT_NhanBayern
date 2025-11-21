import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: true,
    timezone: "+07:00",
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

try {
  await sequelize.authenticate();
  console.log("Kết nối MySQL qua Sequelize thành công!");
} catch (error) {
  console.error("Lỗi kết nối MySQL qua Sequelize:", error.message);
}

export default sequelize;
