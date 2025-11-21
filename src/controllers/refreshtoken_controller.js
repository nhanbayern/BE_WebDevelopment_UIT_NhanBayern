import crypto from "crypto";
import RefreshToken from "../models/refresh_token.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.util.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token)
      return res.status(401).json({ message: "Missing refresh token" });

    const payload = verifyRefreshToken(token); // hoặc jwt.verify
    const tokenHash = hashToken(token);

    const stored = await RefreshToken.findOne({
      where: { token_hash: tokenHash, revoked: false },
    });
    if (!stored)
      return res.status(403).json({ message: "Refresh token revoked/unknown" });

    // Revoke old token (rotation) and set revoked_at, last_used_at
    try {
      stored.revoked = true;
      stored.revoked_at = new Date();
      stored.last_used_at = stored.last_used_at || new Date();
      await stored.save();
    } catch (e) {
      console.error("Failed to revoke old refresh token:", e);
    }

    // --- Khoảng thời gian hết hạn (lấy từ env) ---
    const refreshDays = parseInt(
      process.env.REFRESH_TOKEN_EXPIRES_DAYS || "30",
      10
    ); // số ngày
    const refreshMaxAge = refreshDays * 24 * 60 * 60 * 1000; // mili-giây

    // Tạo refresh token mới
    const newRefreshToken = generateRefreshToken({ user_id: payload.user_id });

    const newHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + refreshMaxAge); // Sequelize DATETIME

    await RefreshToken.create({
      token_hash: newHash,
      user_id: payload.user_id,
      device_info: req.headers["user-agent"] || null,
      ip_address: req.ip || req.connection?.remoteAddress || null,
      expires_at: expiresAt,
      revoked: false,
      last_used_at: null,
    });

    // Set cookie HttpOnly (maxAge phải bằng mili-giây)
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true trên HTTPS production
      sameSite: "Lax", // hoặc 'None' + secure: true nếu cross-site
      path: "/",
      maxAge: refreshMaxAge,
    });

    // Tạo access token mới (ví dụ 15 phút)
    const accessToken = generateAccessToken({ user_id: payload.user_id });
    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: err.message || "Invalid token" });
  }
};
