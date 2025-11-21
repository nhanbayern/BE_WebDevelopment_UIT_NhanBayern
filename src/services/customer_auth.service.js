import bcrypt from "bcryptjs";
import CustomersAccount from "../models/customers_account.model.js";
import Customer from "../models/user.model.js";
import LoginLog from "../models/loginlog.model.js";
import { generateAccessToken } from "../utils/jwt.util.js";

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
  // Tìm account theo google_id
  let account = await CustomersAccount.findOne({
    where: { google_id, login_type: "google" },
  });
  let customer;
  if (account) {
    // Nếu đã có, lấy luôn customer và trả về token (KHÔNG tạo mới bất cứ bản ghi nào)
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
  } else {
    // Nếu chưa có account với google_id, có thể đã có Customer tồn tại với cùng email
    // (ví dụ user đã đăng ký bằng password). Trong trường hợp đó, tái sử dụng profile Customer
    // và chỉ tạo một CustomersAccount mới liên kết tới user hiện có.
    try {
      let existingCustomer = await Customer.findOne({ where: { email } });
      if (existingCustomer) {
        // Nếu đã có profile, tạo account google liên kết tới profile đó
        customer = existingCustomer;
        account = await CustomersAccount.create({
          account_id: "A" + Date.now(),
          user_id: customer.user_id,
          login_type: "google",
          email,
          google_id,
        });
        // log success link
        try {
          await LoginLog.create({
            account_id: account.account_id,
            input_username: email,
            username: customer.username,
            ip_address: ip,
            user_agent: userAgent,
            status: "success",
          });
        } catch (err) {
          console.error("Failed to write login log:", err);
        }
      } else {
        // Tạo mới profile customer + account
        const user_id = "U" + Date.now();
        customer = await Customer.create({ user_id, username, email });
        account = await CustomersAccount.create({
          account_id: "A" + Date.now(),
          user_id,
          login_type: "google",
          email,
          google_id,
        });
        // log success create
        try {
          await LoginLog.create({
            account_id: account.account_id,
            input_username: email,
            username: customer.username,
            ip_address: ip,
            user_agent: userAgent,
            status: "success",
          });
        } catch (err) {
          console.error("Failed to write login log:", err);
        }
      }
    } catch (err) {
      // Nếu xảy ra lỗi validate/unique constraint, trả về thông tin rõ ràng hơn
      const message =
        err && err.name === "SequelizeUniqueConstraintError"
          ? "Dữ liệu đã tồn tại (unique constraint)"
          : (err && err.message) || "Validation error";
      console.error("❌ loginWithGoogle error:", err);
      // log failed attempt
      try {
        await LoginLog.create({
          account_id: account?.account_id || null,
          input_username: email,
          username: username || null,
          ip_address: ip,
          user_agent: userAgent,
          status: "failed",
          error_message: message,
        });
      } catch (e) {
        console.error("Failed to write login log:", e);
      }
      return { success: false, message };
    }
  }
  // return success info; actual refresh token creation and login_log will be
  // handled by `onLoginSuccess` to ensure session_id is linked.
  return { success: true, user: customer, account };
}
