import crypto from "crypto";
import RefreshToken from "../models/refresh_token.model.js";
import LoginLog from "../models/loginlog.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.util.js";
import { getCookieSecurityOptions } from "../utils/cookie_config.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Handle successful customer login
 * UPDATED: Uses customer_id instead of user_id, no more account_id
 */
export async function onLoginSuccess(
  user,
  res,
  ip,
  userAgent,
  account_id = null, // Deprecated but kept for backward compatibility
  input_username = null
) {
  // Support both old (user_id) and new (customer_id) field names
  const customerId = user.customer_id || user.user_id;
  const customerName = user.customername || user.username;
  
  // Generate tokens with new field names
  const payload = { 
    customer_id: customerId,
    user_id: customerId, // Backward compat
    email: user.email,
    customername: customerName,
  };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ user_id: customerId });

  const refreshDays = parseInt(
    process.env.REFRESH_TOKEN_EXPIRES_DAYS || "30",
    10
  );
  const refreshMaxAge = refreshDays * 24 * 60 * 60 * 1000;

  // Store hashed refresh token
  const created = await RefreshToken.create({
    token_hash: hashToken(refreshToken),
    user_id: customerId, // Note: refresh_tokens table still uses user_id column
    device_info: userAgent,
    ip_address: ip,
    expires_at: new Date(Date.now() + refreshMaxAge),
  });

  const session_id = created.session_id;

  // Create login log with customer_id (NEW SCHEMA)
  try {
    await LoginLog.create({
      session_id,
      customer_id: customerId,
      staff_id: null, // This is a customer login, not staff
      input_username,
      username: customerName || customerId,
      ip_address: ip,
      user_agent: userAgent,
      status: "success",
    });
  } catch (err) {
    console.error("Failed to write login log in onLoginSuccess:", err);
  }

  const { secure, sameSite, domain } = getCookieSecurityOptions();
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    domain,
    path: "/",
    maxAge: refreshMaxAge,
  });

  console.log(
    `[COOKIE DEBUG] set refreshToken cookie: domain=${domain ?? "<dynamic>"}, sameSite=${sameSite}, secure=${secure}, maxAge=${refreshMaxAge}`
  );

  // Return user data with backward compatibility
  const userResponse = {
    customer_id: customerId,
    user_id: customerId, // Backward compat
    customername: customerName,
    username: customerName, // Backward compat
    email: user.email,
    phone_number: user.phone_number,
    google_id: user.google_id,
    created_at: user.created_at,
  };

  return { accessToken, user: userResponse, session_id };
}
