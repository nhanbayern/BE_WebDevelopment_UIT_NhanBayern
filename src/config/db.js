import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

// 🧠 Tạo instance Sequelize (ORM)
const sequelize = new Sequelize(
  process.env.DB_NAME, // Tên database
  process.env.DB_USER, // Username
  process.env.DB_PASSWORD, // Mật khẩu
  {
    host: process.env.DB_HOST, // Địa chỉ host
    dialect: "mysql", // Loại DB
    logging: false, // Tắt log SQL (bật để debug)
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// ✅ Kiểm tra kết nối
try {
  await sequelize.authenticate();
  console.log("✅ Kết nối MySQL qua Sequelize thành công!");
} catch (error) {
  console.error("❌ Lỗi kết nối MySQL qua Sequelize:", error.message);
}

export default sequelize;
// Đổi thành sequelize
