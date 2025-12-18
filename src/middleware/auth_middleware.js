// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

/**
 * Authenticates customer tokens
 * UPDATED: Now works with customer_id in JWT payload
 * Token should contain: { customer_id, email, ... }
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.error("[AuthMiddleware] No token provided in Authorization header");
    return res.status(401).json({ message: "Thiếu token" });
  }

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

  let lastError = null;
  for (const secret of secretsToTry) {
    try {
      const decoded = jwt.verify(token, secret);

      // Successfully decoded - set user data
      // Support both old (user_id) and new (customer_id) tokens for backward compatibility
      req.user = {
        customer_id: decoded.customer_id || decoded.user_id,
        user_id: decoded.customer_id || decoded.user_id, // Backward compat alias
        email: decoded.email,
        customername: decoded.customername || decoded.username,
      };
      
      console.log("[AuthMiddleware] Token verified successfully. Customer:", {
        customer_id: req.user.customer_id,
        email: req.user.email,
      });
      return next();
    } catch (err) {
      lastError = err;
      continue;
    }
  }

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

/**
 * Authenticates staff tokens
 * NEW: For staff-only operations
 * Token should contain: { staff_id, login_name, role, ... }
 */
export const authenticateStaff = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.error("[StaffAuthMiddleware] No token provided");
    return res.status(401).json({ message: "Thiếu token" });
  }

  const secretsToTry = [
    process.env.JWT_SECRET,
    process.env.ACCESS_TOKEN_SECRET,
    process.env.TOKEN_SECRET,
  ].filter(Boolean);

  if (secretsToTry.length === 0) {
    console.error("[StaffAuthMiddleware] JWT secret not configured");
    return res.status(500).json({ message: "Server chưa cấu hình JWT secret" });
  }

  let lastError = null;
  for (const secret of secretsToTry) {
    try {
      const decoded = jwt.verify(token, secret);

      // Verify this is a staff token
      if (!decoded.staff_id) {
        throw new Error("Not a staff token");
      }

      req.staff = {
        staff_id: decoded.staff_id,
        login_name: decoded.login_name,
        staff_name: decoded.staff_name,
        position: decoded.position,
      };
      
      console.log("[StaffAuthMiddleware] Staff token verified:", {
        staff_id: req.staff.staff_id,
        login_name: req.staff.login_name,
      });
      return next();
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  console.error("[StaffAuthMiddleware] Verification failed:", lastError?.message);

  if (lastError && lastError.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token hết hạn" });
  }

  return res.status(403).json({
    message: "Token không hợp lệ hoặc không phải tài khoản staff",
    error: lastError?.message,
  });
};
