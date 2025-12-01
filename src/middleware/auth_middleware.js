// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  // lấy token từ header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.error("[AuthMiddleware] No token provided in Authorization header");
    return res.status(401).json({ message: "Thiếu token" });
  }

  // Try common env names for the access token secret
  const secretsToTry = [
    process.env.JWT_SECRET,
    process.env.ACCESS_TOKEN_SECRET,
    process.env.TOKEN_SECRET,
  ].filter(Boolean);

  if (secretsToTry.length === 0) {
    console.error(
      "[AuthMiddleware] JWT secret is not configured in environment variables"
    );
    return res.status(500).json({ message: "Server chưa cấu hình JWT secret" });
  }

  // Try verifying with each secret synchronously
  let lastError = null;
  for (const secret of secretsToTry) {
    try {
      const decoded = jwt.verify(token, secret);

      // Successfully decoded - set user and continue
      req.user = decoded;
      console.log("[AuthMiddleware] Token verified successfully. User:", {
        userId: decoded.userId,
        username: decoded.username,
      });
      return next();
    } catch (err) {
      lastError = err;
      // Continue to next secret if available
      continue;
    }
  }

  // All secrets failed - return error
  console.error(
    "[AuthMiddleware] JWT verify failed with all secrets:",
    lastError?.message
  );

  if (lastError && lastError.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token hết hạn" });
  }

  return res.status(403).json({
    message: "Token không hợp lệ",
    error: lastError?.message,
  });
};
