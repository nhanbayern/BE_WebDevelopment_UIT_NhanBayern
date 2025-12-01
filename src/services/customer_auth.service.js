import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import CustomersAccount from "../models/customers_account.model.js";
import Customer from "../models/user.model.js";
import LoginLog from "../models/loginlog.model.js";

// Đăng nhập bằng email + password
export async function loginWithPassword(email, password, ip, userAgent) {
  // Tìm account
  let account = await CustomersAccount.findOne({
    where: { email, login_type: "password" },
  });
  let customer;
  if (!account) {
    // Do NOT auto-create accounts on login — treat as failed login
    try {
      await LoginLog.create({
        account_id: null,
        input_username: email,
        username: null,
        ip_address: ip,
        user_agent: userAgent,
        status: "failed",
        error_message: "Tài khoản không tồn tại",
      });
    } catch (err) {
      console.error("Failed to write login log:", err);
    }
    return { success: false, message: "Tài khoản không tồn tại" };
  } else {
    if (!account.password_hash) {
      // log failed
      try {
        await LoginLog.create({
          account_id: account.account_id,
          input_username: email,
          username: account.user_id,
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
    const match = await bcrypt.compare(password, account.password_hash);
    if (!match) {
      // log failed password attempt
      try {
        const existingCustomer = await Customer.findOne({
          where: { user_id: account.user_id },
        });
        await LoginLog.create({
          account_id: account.account_id,
          input_username: email,
          username: existingCustomer?.username || account.user_id,
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
    customer = await Customer.findOne({ where: { user_id: account.user_id } });
    if (!customer) {
      try {
        await LoginLog.create({
          account_id: account.account_id,
          input_username: email,
          username: account.user_id,
          ip_address: ip,
          user_agent: userAgent,
          status: "failed",
          error_message: "Không tìm thấy profile Customer",
        });
      } catch (err) {
        console.error("Failed to write login log:", err);
      }
      return { success: false, message: "Không tìm thấy profile Customer" };
    }
  }
  // return success info; actual refresh token creation and login_log will be
  // handled by `onLoginSuccess` to ensure session_id is linked.
  return { success: true, user: customer, account };
}

// Đăng nhập bằng Google callback với google_id và email
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

  let account = await CustomersAccount.findOne({
    where: { [Op.or]: lookupConditions },
  });

  const ensureLoginLog = async (status, message = null) => {
    try {
      await LoginLog.create({
        account_id: account?.account_id || null,
        input_username: email,
        username: username || null,
        ip_address: ip,
        user_agent: userAgent,
        status,
        error_message: message,
      });
    } catch (logErr) {
      console.error("Failed to write login log:", logErr);
    }
  };

  let customer;

  if (account) {
    customer = await Customer.findOne({ where: { user_id: account.user_id } });
    if (!customer) {
      await ensureLoginLog("failed", "Không tìm thấy profile Customer");
      return { success: false, message: "Không tìm thấy profile Customer" };
    }

    if (!account.google_id && google_id) {
      account.google_id = google_id;
      await account.save();
    }
  } else {
    try {
      customer = await Customer.findOne({ where: { email } });
      if (customer) {
        if (!customer.google_id && google_id) {
          customer.google_id = google_id;
          await customer.save();
        }
      } else {
        const user_id = `U${Date.now()}${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")}`;
        customer = await Customer.create({
          user_id,
          username: username || email,
          email,
          google_id,
        });
      }

      account = await CustomersAccount.create({
        account_id: `A${Date.now()}${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")}`,
        user_id: customer.user_id,
        login_type: "google",
        email,
        google_id,
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

  return { success: true, user: customer, account };
}
