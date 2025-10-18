const mysql = require("mysql2/promise"); // <-- THAY ĐỔI 1: Thêm /promise
const dotenv = require("dotenv");

// Nạp biến môi trường từ file .env
dotenv.config({ path: "./.env" });

// Tạo KẾT NỐI POOL thay vì 1 kết nối đơn
// Pool sẽ tự động quản lý việc mở/đóng kết nối
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Bạn không cần .connect() nữa, pool tự quản lý
// Chỉ cần export pool ra là xong
console.log("✅ Đã kết nối MySQL Pool thành công!");

module.exports = pool; // <-- THAY ĐỔI 3: Export pool
