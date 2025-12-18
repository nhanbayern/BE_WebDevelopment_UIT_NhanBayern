import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import Customer from "../models/user.model.js";
import LoginLog from "../models/loginlog.model.js";

/**
 * Login with email + password
 * UPDATED: No more customers_account table, authentication is directly in customers table
 */
export async function loginWithPassword(email, password, ip, userAgent) {
  // Find customer by email with password login_type
  let customer = await Customer.findOne({
    where: { email, login_type: "password" },
  });
  
  if (!customer) {
    // Log failed login attempt
    try {
      await LoginLog.create({
        customer_id: null,
        staff_id: null,
        input_username: email,
        username: email,
        ip_address: ip,
        user_agent: userAgent,
        status: "failed",
        error_message: "Tài khoản không tồn tại",
      });
    } catch (err) {
      console.error("Failed to write login log:", err);
    }
    return { success: false, message: "Tài khoản không tồn tại" };
  }
  
  if (!customer.password_hash) {
    // Log failed - no password set
    try {
      await LoginLog.create({
        customer_id: customer.customer_id,
        staff_id: null,
        input_username: email,
        username: customer.customername,
        ip_address: ip,
        user_agent: userAgent,
        status: "failed",
        error_message: "Tài khoản chưa có mật khẩu",
      });
    } catch (err) {
      console.error("Failed to write login log:", err);
    }
    return { success: false, message: "Tài khoản chưa có mật khẩu" };
  }
  
  const match = await bcrypt.compare(password, customer.password_hash);
  if (!match) {
    // Log failed password attempt
    try {
      await LoginLog.create({
        customer_id: customer.customer_id,
        staff_id: null,
        input_username: email,
        username: customer.customername,
        ip_address: ip,
        user_agent: userAgent,
        status: "failed",
        error_message: "Sai mật khẩu",
      });
    } catch (err) {
      console.error("Failed to write login log:", err);
    }
    return { success: false, message: "Sai mật khẩu" };
  }
  
  // Success - return user data
  // Actual refresh token creation and login_log will be handled by onLoginSuccess
  return { success: true, user: customer };
}

/**
 * Login with Google callback
 * UPDATED: No more customers_account table, authentication is directly in customers table
 */
export async function loginWithGoogle(
  google_id,
  email,
  username,
  ip,
  userAgent
) {
  if (!email) {
    return { success: false, message: "Không lấy được email từ Google" };
  }

  const lookupConditions = [];
  if (google_id) lookupConditions.push({ google_id });
  lookupConditions.push({ email });

  let customer = await Customer.findOne({
    where: { [Op.or]: lookupConditions },
  });

  const ensureLoginLog = async (status, message = null) => {
    try {
      await LoginLog.create({
        customer_id: customer?.customer_id || null,
        staff_id: null,
        input_username: email,
        username: username || email,
        ip_address: ip,
        user_agent: userAgent,
        status,
        error_message: message,
      });
    } catch (logErr) {
      console.error("Failed to write login log:", logErr);
    }
  };

  if (customer) {
    // Existing customer - update google_id if needed
    if (!customer.google_id && google_id) {
      customer.google_id = google_id;
      await customer.save();
    }
  } else {
    // New customer - create account
    try {
      const customer_id = `C${Date.now()}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`;
      
      customer = await Customer.create({
        customer_id,
        customername: username || email.split("@")[0],
        email,
        google_id,
        login_type: "google",
        password_hash: null, // Google login doesn't need password
      });

      await ensureLoginLog("success");
    } catch (err) {
      const message =
        err && err.name === "SequelizeUniqueConstraintError"
          ? "Dữ liệu đã tồn tại (unique constraint)"
          : (err && err.message) || "Validation error";
      console.error("❌ loginWithGoogle error:", err);
      await ensureLoginLog("failed", message);
      return { success: false, message };
    }
  }

  return { success: true, user: customer };
}
