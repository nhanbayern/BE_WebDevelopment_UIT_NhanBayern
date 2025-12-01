import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const sequelize = new Sequelize(
  process.env.CLOUD_DB_NAME,
  process.env.CLOUD_DB_USER,
  process.env.CLOUD_DB_PASSWORD,
  {
    host: process.env.CLOUD_DB_HOST,
    port: process.env.CLOUD_DB_PORT, // <--- thêm port ở đây
    dialect: "mysql",
    logging: console.log,
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
