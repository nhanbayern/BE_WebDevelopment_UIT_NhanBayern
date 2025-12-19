import crypto from "crypto";
import jwt from "jsonwebtoken";
import RefreshToken from "../models/refresh_token.model.js";
import Staff from "../models/staff.model.js";
import { Op } from "sequelize";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} from "../utils/jwt.util.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Helper function to check if an access token is still valid.
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

/**
 * Refresh staff access token
 * POST /staff/auth/refresh
 */
export const refreshStaffToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.staffRefreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Missing refresh token"
      });
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token"
      });
    }

    const tokenHash = hashToken(refreshToken);
    console.log(`[STAFF REFRESH] Token hash: ${tokenHash}`);

    // Check if access token exists and is still valid
    const accessToken = extractAccessToken(req);
    const accessTokenCheck = isAccessTokenValid(accessToken);

    console.log(`[STAFF REFRESH] Access token status:`, {
      exists: !!accessToken,
      valid: accessTokenCheck.valid,
      reason: accessTokenCheck.reason,
    });

    // If access token is still valid, return it without rotation
    if (accessTokenCheck.valid) {
      console.log("[STAFF REFRESH] Access token still valid, no rotation needed");
      return res.json({
        success: true,
        accessToken,
        message: "Access token still valid"
      });
    }

    // Find refresh token in shared refresh_tokens table
    // Note: staff_id is stored in user_id column
    const tokenRecord = await RefreshToken.findOne({
      where: {
        token_hash: tokenHash,
        user_id: payload.staff_id, // staff_id stored in user_id column
        revoked: false,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!tokenRecord) {
      console.log("[STAFF REFRESH] Token not found or revoked");
      return res.status(401).json({
        success: false,
        message: "Refresh token not found or revoked"
      });
    }

    // Get staff info
    const staff = await Staff.findByPk(payload.staff_id);
    
    if (!staff || staff.status !== "ACTIVE") {
      // Revoke the token
      await tokenRecord.update({ revoked: true, revoked_at: new Date() });
      return res.status(401).json({
        success: false,
        message: "Staff account not active"
      });
    }

    // Generate new access token (15 minutes)
    const newAccessToken = jwt.sign(
      {
        staff_id: staff.staff_id,
        login_name: staff.login_name,
        staff_name: staff.staff_name,
        position: staff.position,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Update last used time
    await tokenRecord.update({ last_used_at: new Date() });

    console.log("[STAFF REFRESH] New access token generated successfully");

    return res.json({
      success: true,
      accessToken: newAccessToken,
      staff: {
        staff_id: staff.staff_id,
        login_name: staff.login_name,
        staff_name: staff.staff_name,
        position: staff.position,
        status: staff.status,
      },
    });
  } catch (error) {
    console.error("[STAFF REFRESH] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
