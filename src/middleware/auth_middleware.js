// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  // lấy token từ header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Thiếu token" });
  // 2️⃣ Giải mã token bằng SECRET
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token không hợp lệ" });
    // 3️⃣ Lưu thông tin user từ token vào req.user
    req.user = user;
    next();
  });
};
