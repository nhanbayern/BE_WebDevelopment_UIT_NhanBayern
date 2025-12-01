import crypto from "crypto";
import RefreshToken from "../models/refresh_token.model.js";
import LoginLog from "../models/loginlog.model.js";
import Customer from "../models/user.model.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token not provided" });
    }
    if (token) {
      const tokenHash = hashToken(token);

      // find the refresh token row so we can map to user_id
      const row = await RefreshToken.findOne({
        where: { token_hash: tokenHash },
      });
      if (row) {
        // revoke the refresh token and set revoked_at
        await RefreshToken.update(
          { revoked: true, revoked_at: new Date() },
          { where: { session_id: row.session_id } }
        );

        // try to update login_logs for this session_id
        try {
          // First try to set logout_time and status='logout'
          await LoginLog.update(
            { logout_time: new Date(), status: "logout" },
            {
              where: {
                session_id: row.session_id,
              },
            }
          );
        } catch (e) {
          console.error(
            "Failed to update login_logs logout_time and status (attempt 1):",
            e
          );
          try {
            // Fallback: at least update logout_time only (some DBs may reject new enum value)
            await LoginLog.update(
              { logout_time: new Date() },
              {
                where: {
                  session_id: row.session_id,
                },
              }
            );
          } catch (e2) {
            console.error(
              "Failed to update login_logs logout_time (fallback):",
              e2
            );
          }
        }
      } else {
        // if no DB row, still attempt to revoke by hash
        await RefreshToken.update(
          { revoked: true },
          { where: { token_hash: tokenHash } }
        );
      }
    }

    res.clearCookie("refreshToken", { path: "/" });
    res.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};
