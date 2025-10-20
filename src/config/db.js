import mysql from "mysql2";
import dotenv from "dotenv";

// 🔧 Nạp biến môi trường từ file .env
dotenv.config({ path: "./.env" });

// ⚙️ Tạo connection pool (quản lý tự động kết nối MySQL)
const db = mysql.createPool({
  host: process.env.DB_HOST, // Địa chỉ host MySQL
  user: process.env.DB_USER, // Tên user
  password: process.env.DB_PASSWORD, // Mật khẩu
  database: process.env.DB_NAME, // Tên database
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ Kiểm tra kết nối (tùy chọn)
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Kết nối MySQL thất bại:", err.message);
  } else {
    console.log("✅ Đã kết nối MySQL Pool thành công!");
    connection.release(); // Trả kết nối về pool
  }
});

// 🧩 Export pool cho các module khác sử dụng
export default db.promise(); // Dùng promise pool để hỗ trợ async/await
