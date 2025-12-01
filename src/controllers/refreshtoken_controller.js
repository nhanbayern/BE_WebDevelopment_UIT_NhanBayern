import crypto from "crypto";
import jwt from "jsonwebtoken";
import RefreshToken from "../models/refresh_token.model.js";
import sequelize from "../config/db.js";
import { Transaction, Op } from "sequelize";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} from "../utils/jwt.util.js";
import { getCookieSecurityOptions } from "../utils/cookie_config.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Helper function to check if an access token is still valid.
 * Returns { valid: boolean, payload?: object, reason?: string }
 */
function isAccessTokenValid(token) {
  if (!token) {
    return { valid: false, reason: "no_token" };
  }

  try {
    const payload = verifyAccessToken(token);
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp > now) {
      return { valid: true, payload };
    }

    return { valid: false, reason: "expired", payload };
  } catch (err) {
    return { valid: false, reason: "invalid" };
  }
}

/**
 * Extract Bearer token from Authorization header
 */
function extractAccessToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
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

    // Check if access token exists and is still valid
    const accessToken = extractAccessToken(req);
    const accessTokenCheck = isAccessTokenValid(accessToken);

    console.log(`[REFRESH DEBUG] access token status:`, {
      exists: !!accessToken,
      valid: accessTokenCheck.valid,
      reason: accessTokenCheck.reason,
    });

    // If access token is valid, return it without rotation
    if (accessTokenCheck.valid) {
      console.log(
        "[REFRESH DEBUG] Access token still valid, no rotation needed"
      );
      return res.json({
        accessToken,
        rotated: false,
        message: "Access token still valid",
      });
    }

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

    // Determine if we should rotate based on access token status
    const shouldRotate = accessTokenCheck.reason === "expired";

    console.log(`[REFRESH DEBUG] rotation decision:`, {
      shouldRotate,
      reason: accessTokenCheck.reason,
      hasAccessToken: !!accessToken,
    });

    // If no access token (typical F5 reload), issue new access token without rotation
    if (!accessToken || accessTokenCheck.reason === "no_token") {
      console.log(
        "[REFRESH DEBUG] No access token (F5 reload), issuing new access token without rotation"
      );

      await transaction.rollback();
      transaction = null;

      const newAccessToken = generateAccessToken({ user_id: payload.user_id });
      return res.json({
        accessToken: newAccessToken,
        rotated: false,
        message: "Access token issued without rotation",
      });
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
        const newAccessToken = generateAccessToken({
          user_id: payload.user_id,
        });
        return res.json({
          accessToken: newAccessToken,
          rotated: false,
          message: "Recent refresh detected, using existing rotation",
        });
      }
    }

    // ROTATION LOGIC: Only executed if access token is expired
    if (!shouldRotate) {
      console.log(
        "[REFRESH DEBUG] Skipping rotation, access token not expired"
      );
      await transaction.rollback();
      transaction = null;

      const newAccessToken = generateAccessToken({ user_id: payload.user_id });
      return res.json({
        accessToken: newAccessToken,
        rotated: false,
      });
    }

    console.log("[REFRESH DEBUG] Access token expired, performing rotation");

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
    const { sameSite, secure, domain } = getCookieSecurityOptions();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: "/",
      maxAge: refreshMaxAge,
    });

    console.log(
      `[COOKIE DEBUG] refreshed cookie: domain=${domain ?? "<dynamic>"}, sameSite=${sameSite}, secure=${secure}, maxAge=${refreshMaxAge}`
    );

    const newAccessToken = generateAccessToken({ user_id: payload.user_id });
    return res.json({
      accessToken: newAccessToken,
      rotated: true,
      message: "Refresh token rotated",
    });
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error("[REFRESH ERROR]", err);
    return res.status(403).json({ message: err.message || "Invalid token" });
  }
};
