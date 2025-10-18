const mysql = require("mysql2");
const dotenv = require("dotenv");

// Nạp biến môi trường từ file .env
dotenv.config({ path: "./.env" });

// Tạo kết nối MySQL
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Kiểm tra kết nối
connection.connect((err) => {
  if (err) {
    console.error("❌ Kết nối database thất bại:", err);
  } else {
    console.log("✅ Đã kết nối MySQL thành công!");
  }
});

module.exports = connection;
