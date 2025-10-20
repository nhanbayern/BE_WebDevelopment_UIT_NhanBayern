import bcrypt from "bcryptjs"; // ✅ chuẩn tên để dùng trực tiếp
import jwt from "jsonwebtoken";
import db from "../config/db.js";

/**
 * [POST] /RuouOngTu/auth/login
 * Mô tả: Nhân viên hoặc Manager đăng nhập
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1️⃣ Kiểm tra dữ liệu đ ầu vào
    if (!username || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập username và password",
      });
    }

    // 2️⃣ Truy vấn tài khoản theo username
    const [rows] = await db.execute(
      "SELECT * FROM employee_accounts WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Tài khoản không tồn tại",
      });
    }

    const user = rows[0];

    // 3️⃣ Kiểm tra tài khoản có bị khóa không
    if (user.is_locked) {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản lý.",
      });
    }

    // 4️⃣ So sánh mật khẩu người dùng nhập và hash trong DB
    const match = await bcrypt.compare(password, user.password_hash); // ✅ bcryptjs method
    if (!match) {
      return res.status(401).json({
        message: "Sai mật khẩu",
      });
    }

    // 5️⃣ Tạo JWT Token
    const payload = {
      account_id: user.account_id,
      employee_id: user.employee_id,
      username: user.username,
      role: user.role,
    };

    if (!process.env.JWT_SECRET) {
      throw new Error("Thiếu JWT_SECRET trong file .env");
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "8h",
    }); // Dùng thuật toán HMAC mặc định là HS256

    // 6️⃣ Cập nhật thời điểm đăng nhập cuối vào Db thông qua DBMS
    await db.execute(
      "UPDATE employee_accounts SET last_login = NOW() WHERE account_id = ?",
      [user.account_id]
    );

    // 7️⃣ Trả phản hồi thành công
    res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: {
        employee_id: user.employee_id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi đăng nhập:", err.message);
    console.error("Chi tiết lỗi:", err);
    res.status(500).json({
      message: "Lỗi server khi đăng nhập",
      error: err.message,
    });
  }
};

/**
 * [GET] /RuouOngTu/auth/verify
 * Mô tả: Kiểm tra token hợp lệ
 */
export const verifyToken = async (req, res) => {
  try {
    console.log(">>> req.headers.authorization =", req.headers.authorization); // <-- thêm dòng này
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Thiếu token xác thực" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.status(200).json({
      valid: true,
      message: "Token hợp lệ",
      user: decoded,
    });
  } catch (err) {
    res.status(403).json({
      valid: false,
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};
