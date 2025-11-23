// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  // lấy token từ header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Thiếu token" });

  // Try common env names for the access token secret to be more robust
  const secretsToTry = [
    process.env.JWT_SECRET,
    process.env.ACCESS_TOKEN_SECRET,
    process.env.TOKEN_SECRET,
  ].filter(Boolean);

  if (secretsToTry.length === 0) {
    console.error("JWT secret is not configured in environment variables");
    return res.status(500).json({ message: "Server chưa cấu hình JWT secret" });
  }

  // helper to attempt verify with multiple secrets
  const tryVerify = (i) => {
    const secret = secretsToTry[i];
    jwt.verify(token, secret, (err, user) => {
      if (!err && user) {
        req.user = user;
        return next();
      }
      if (i + 1 < secretsToTry.length) return tryVerify(i + 1);

      // All attempts failed — log the error and return clearer response
      console.error("JWT verify failed:", err);
      if (err && err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token hết hạn" });
      }
      return res.status(403).json({ message: "Token không hợp lệ" });
    });
  };

  tryVerify(0);
};
