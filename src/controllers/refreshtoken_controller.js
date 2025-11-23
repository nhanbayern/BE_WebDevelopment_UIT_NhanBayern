import crypto from "crypto";
import RefreshToken from "../models/refresh_token.model.js";
import sequelize from "../config/db.js";
import { Transaction, Op } from "sequelize";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.util.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const refresh = async (req, res) => {
  let transaction;
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Missing refresh token" });
    }

    const payload = verifyRefreshToken(token);
    const tokenHash = hashToken(token);
    console.log(`[REFRESH DEBUG] incoming refresh token hash: ${tokenHash}`);

    // Start transaction with row locking to prevent concurrent refreshes
    transaction = await sequelize.transaction();

    const stored = await RefreshToken.findOne({
      where: { token_hash: tokenHash },
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });

    if (stored) {
      console.log(
        `[REFRESH DEBUG] found refresh token record: session_id=${stored.session_id}, revoked=${stored.revoked}, expires_at=${stored.expires_at}, last_used_at=${stored.last_used_at}`
      );
    } else {
      console.log(
        "[REFRESH DEBUG] no refresh token record found for that hash"
      );
    }

    if (!stored || stored.revoked) {
      await transaction.rollback();
      return res.status(403).json({ message: "Refresh token revoked/unknown" });
    }

    // Check if token was recently used (within grace period)
    const now = new Date();
    const gracePeriodMs = 5000; // 5 seconds grace period
    const recentlyUsed =
      stored.last_used_at &&
      now.getTime() - stored.last_used_at.getTime() < gracePeriodMs;

    if (recentlyUsed) {
      console.log(
        "[REFRESH DEBUG] Token recently used, checking for newer token"
      );

      // Look for newer token for this user
      const newerToken = await RefreshToken.findOne({
        where: {
          user_id: payload.user_id,
          revoked: false,
          created_at: { [Op.gt]: stored.created_at },
        },
        order: [["created_at", "DESC"]],
        transaction,
      });

      if (newerToken) {
        console.log(
          "[REFRESH DEBUG] Found newer token, using access token only"
        );
        await transaction.commit();
        transaction = null;

        // Return access token without rotating refresh token
        const accessToken = generateAccessToken({ user_id: payload.user_id });
        return res.json({ accessToken });
      }
    }

    // Update last_used_at but don't revoke yet (delayed revoke)
    await stored.update(
      {
        last_used_at: now,
      },
      { transaction }
    );

    // Create new refresh token within transaction
    const refreshDays = parseInt(
      process.env.REFRESH_TOKEN_EXPIRES_DAYS || "30",
      10
    );
    const refreshMaxAge = refreshDays * 24 * 60 * 60 * 1000;

    const newRefreshToken = generateRefreshToken({ user_id: payload.user_id });
    const newHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + refreshMaxAge);

    await RefreshToken.create(
      {
        token_hash: newHash,
        user_id: payload.user_id,
        device_info: req.headers["user-agent"] || null,
        ip_address: req.ip || req.connection?.remoteAddress || null,
        expires_at: expiresAt,
        revoked: false,
        last_used_at: null,
      },
      { transaction }
    );

    // Commit transaction before setting cookie
    await transaction.commit();
    transaction = null;

    // Schedule delayed revoke of old token (after grace period)
    setTimeout(async () => {
      try {
        await stored.update({
          revoked: true,
          revoked_at: new Date(),
        });
        console.log(
          `[REFRESH DEBUG] Delayed revoke completed for token hash: ${tokenHash}`
        );
      } catch (err) {
        console.error("[REFRESH DEBUG] Failed to delayed revoke token:", err);
      }
    }, gracePeriodMs);

    // Set cookie and return access token
    const isProd = process.env.NODE_ENV === "production";
    const sameSite = isProd ? "none" : "lax";
    const secure = isProd;

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: "/",
      maxAge: refreshMaxAge,
    });

    console.log(
      `[COOKIE DEBUG] refreshed cookie: sameSite=${sameSite}, secure=${secure}, maxAge=${refreshMaxAge}`
    );

    const accessToken = generateAccessToken({ user_id: payload.user_id });
    return res.json({ accessToken });
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error("[REFRESH ERROR]", err);
    return res.status(403).json({ message: err.message || "Invalid token" });
  }
};
