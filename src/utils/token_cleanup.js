import RefreshToken from "../models/refresh_token.model.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";

export const cleanupExpiredTokens = async () => {
  try {
    const now = new Date();

    // Delete expired tokens
    const expiredResult = await RefreshToken.destroy({
      where: {
        expires_at: {
          [Op.lt]: now,
        },
      },
    });

    // Delete old revoked tokens (older than 1 day)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const revokedResult = await RefreshToken.destroy({
      where: {
        revoked: true,
        revoked_at: {
          [Op.lt]: oneDayAgo,
        },
      },
    });

    console.log(
      `[CLEANUP] Removed ${expiredResult} expired tokens and ${revokedResult} old revoked tokens`
    );

    return { expired: expiredResult, revoked: revokedResult };
  } catch (error) {
    console.error("[CLEANUP ERROR]", error);
    return null;
  }
};

export const startTokenCleanupScheduler = () => {
  // Run cleanup every hour
  const intervalMs = 60 * 60 * 1000; // 1 hour

  console.log("[CLEANUP] Starting token cleanup scheduler");

  // Run immediately
  cleanupExpiredTokens();

  // Schedule recurring cleanup
  setInterval(() => {
    cleanupExpiredTokens();
  }, intervalMs);
};
