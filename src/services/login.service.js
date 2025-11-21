import crypto from "crypto";
import RefreshToken from "../models/refresh_token.model.js";
import LoginLog from "../models/loginlog.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.util.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function onLoginSuccess(
  user,
  res,
  ip,
  userAgent,
  account_id = null,
  input_username = null
) {
  const payload = { user_id: user.user_id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ user_id: user.user_id });

  // compute refresh expiry from env (days)
  const refreshDays = parseInt(
    process.env.REFRESH_TOKEN_EXPIRES_DAYS || "30",
    10
  );
  const refreshMaxAge = refreshDays * 24 * 60 * 60 * 1000;

  // store hashed refresh token and obtain session_id
  const created = await RefreshToken.create({
    token_hash: hashToken(refreshToken),
    user_id: user.user_id,
    device_info: userAgent,
    ip_address: ip,
    expires_at: new Date(Date.now() + refreshMaxAge),
  });

  const session_id = created.session_id;

  // create login log linking to this session
  try {
    await LoginLog.create({
      session_id,
      account_id,
      input_username,
      username: user.username || user.user_id,
      ip_address: ip,
      user_agent: userAgent,
      status: "success",
    });
  } catch (err) {
    console.error("Failed to write login log in onLoginSuccess:", err);
  }

  // set cookie HttpOnly
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: refreshMaxAge,
  });

  return { accessToken, user, session_id };
}
