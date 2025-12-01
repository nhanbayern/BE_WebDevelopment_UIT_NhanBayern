import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import EmailOTP from "../models/email_otp.model.js";
import Customer from "../models/user.model.js";
import CustomersAccount from "../models/customers_account.model.js";
import { onLoginSuccess } from "./login.service.js";

// -----------------------
// 📌 CONFIG SMTP (Gmail)
// -----------------------
const USER_EMAIL = (process.env.USER_EMAIL || "").trim();
const NODE_MAILER_KEY = (process.env.NODE_MAILER_KEY || "").trim();

// Gmail App Password required
let _transporter = null;

if (USER_EMAIL && NODE_MAILER_KEY) {
  try {
    _transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // SSL bắt buộc với port 465
      auth: {
        user: USER_EMAIL,
        pass: NODE_MAILER_KEY, // đây là APP PASSWORD 16 ký tự
      },
    });

    console.log("[EmailOTP] Gmail SMTP transporter created for:", USER_EMAIL);
  } catch (err) {
    console.error("[EmailOTP] Failed creating Gmail transporter", err);
    _transporter = null;
  }
} else {
  console.warn("[EmailOTP] Missing USER_EMAIL or NODE_MAILER_KEY in .env");
}

// -----------------------
// 📌 OTP GENERATOR
// -----------------------
function generateNumericOtp(len = 6) {
  const min = Math.pow(10, len - 1);
  const max = Math.pow(10, len) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

// -----------------------
// 📌 SEND OTP EMAIL
// -----------------------
export async function sendOtpEmail(toEmail, otp) {
  const from = USER_EMAIL; // Gmail yêu cầu from phải trùng user

  const html = `<p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`;
  const subject = "Your Verification Code";

  if (!_transporter) {
    console.warn("[EmailOTP] Transporter not configured");
    return { success: false, reason: "smtp_not_configured" };
  }

  try {
    console.log("[EmailOTP] Sending OTP email to:", toEmail);

    const info = await _transporter.sendMail({
      from,
      to: toEmail,
      subject,
      html,
    });

    console.log("[EmailOTP] Email sent:", info.messageId);

    return { success: true, info };
  } catch (err) {
    console.error("[EmailOTP] Failed to send OTP email", err);
    return { success: false, reason: "send_error", err };
  }
}

// -----------------------
// 📌 CREATE + SEND OTP
// -----------------------
export async function createAndSendOtp({
  email,
  otp_type = "register",
  ip = null,
  user_agent = null,
  device_fingerprint = null,
}) {
  // check if email exists in users table
  const existing = await Customer.findOne({ where: { email } });
  if (existing) {
    return { success: false, code: 409, message: "Email exists" };
  }

  const otp = generateNumericOtp(6);
  const otp_hash = await bcrypt.hash(otp, 10);
  const expired_at = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

  const now = new Date();
  const payload = {
    otp_hash,
    otp_type,
    expired_at,
    attempt_count: 0,
    max_attempts: 5,
    resend_count: 0,
    resend_at: null,
    ip_address: ip,
    user_agent,
    device_fingerprint,
    updated_at: now,
  };

  // upsert OTP with duplicate prevention
  const existingOtp = await EmailOTP.findOne({ where: { email } });
  if (existingOtp) {
    // If an OTP was recently created/updated, avoid generating/sending a new one to prevent double-send.
    const lastUpdate = new Date(
      existingOtp.updated_at || existingOtp.created_at || 0
    ).getTime();
    const nowTs = Date.now();
    const MIN_RESEND_MS = 30 * 1000; // 30 seconds
    if (nowTs - lastUpdate < MIN_RESEND_MS) {
      console.debug(
        "[EmailOTP] recent OTP exists, skipping new send to avoid duplicate",
        { email, lastUpdate }
      );
      return { success: true, message: "OTP recently sent" };
    }
    await EmailOTP.update(payload, { where: { email } });
  } else {
    await EmailOTP.create({ email, created_at: now, ...payload });
  }

  // send email
  const sendResult = await sendOtpEmail(email, otp);
  if (!sendResult.success) console.warn("[EmailOTP] Failed", sendResult);

  return { success: true };
}

// -----------------------
// 📌 VERIFY OTP
// -----------------------
export async function verifyOtp({ email, otp }) {
  const record = await EmailOTP.findOne({ where: { email } });
  if (!record) return { success: false, message: "OTP not found" };

  if (record.attempt_count >= record.max_attempts)
    return { success: false, message: "Too many attempts" };

  if (new Date(record.expired_at) < new Date())
    return { success: false, message: "OTP expired" };

  const match = await bcrypt.compare(otp, record.otp_hash);
  if (!match) {
    await EmailOTP.update(
      { attempt_count: record.attempt_count + 1 },
      { where: { email } }
    );
    return { success: false, message: "OTP incorrect" };
  }

  return { success: true };
}

// -----------------------
// 📌 FINALIZE REGISTRATION
// -----------------------
export async function finalizeRegistration({
  email,
  username,
  ip,
  user_agent,
  res,
  password,
  phone,
}) {
  const user_id = "U" + Date.now();
  const account_id = "A" + Date.now();

  // basic phone validation: optional, accept + and digits 7-15 length
  const phone_number =
    typeof phone === "string" && /^\+?\d{7,15}$/.test(phone) ? phone : null;

  const createdUser = await Customer.create({
    user_id,
    username,
    email,
    phone_number,
  });

  const accountPayload = {
    account_id,
    user_id,
    login_type: "password",
    email,
  };
  if (password) {
    try {
      const passHash = await bcrypt.hash(password, 10);
      accountPayload.password_hash = passHash;
    } catch (err) {
      console.warn(
        "[EmailOTP] Failed to hash password during finalizeRegistration",
        err
      );
    }
  }
  await CustomersAccount.create(accountPayload);

  await EmailOTP.destroy({ where: { email } });

  return await onLoginSuccess(
    createdUser,
    res,
    ip,
    user_agent,
    account_id,
    email
  );
}

// -----------------------
// 📌 RESEND OTP
// -----------------------
export async function resendOtp({
  email,
  ip = null,
  user_agent = null,
  device_fingerprint = null,
}) {
  const record = await EmailOTP.findOne({ where: { email } });
  if (!record) return { success: false, message: "OTP not found" };

  if (record.resend_count >= 5)
    return { success: false, message: "Too many resend attempts" };

  if (
    record.resend_at &&
    (new Date() - new Date(record.resend_at)) / 1000 < 60
  ) {
    return { success: false, message: "Try again later" };
  }

  const otp = generateNumericOtp(6);
  const otp_hash = await bcrypt.hash(otp, 10);
  const expired_at = new Date(Date.now() + 10 * 60 * 1000);

  await EmailOTP.update(
    {
      otp_hash,
      expired_at,
      resend_at: new Date(),
      resend_count: record.resend_count + 1,
      ip_address: ip || record.ip_address,
      user_agent: user_agent || record.user_agent,
      device_fingerprint: device_fingerprint || record.device_fingerprint,
      updated_at: new Date(),
    },
    { where: { email } }
  );

  const sendResult = await sendOtpEmail(email, otp);
  if (!sendResult.success) console.warn("[EmailOTP] resend error:", sendResult);

  return { success: true };
}

// -----------------------
// 📌 CREATE + SEND RESET PASSWORD OTP
// -----------------------
export async function createAndSendResetOtp({
  email,
  ip = null,
  user_agent = null,
  device_fingerprint = null,
}) {
  // For reset flow, email must exist in customers_account
  const acct = await CustomersAccount.findOne({ where: { email } });
  if (!acct) return { success: false, code: 404, message: "Email not found" };

  const otp = generateNumericOtp(6);
  const otp_hash = await bcrypt.hash(otp, 10);
  const expired_at = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

  const now = new Date();
  const payload = {
    otp_hash,
    otp_type: "forgot_password",
    expired_at,
    attempt_count: 0,
    max_attempts: 5,
    resend_count: 0,
    resend_at: null,
    ip_address: ip,
    user_agent,
    device_fingerprint,
    updated_at: now,
  };

  const existingOtp = await EmailOTP.findOne({ where: { email } });
  if (existingOtp) {
    const lastUpdate = new Date(
      existingOtp.updated_at || existingOtp.created_at || 0
    ).getTime();
    const nowTs = Date.now();
    const MIN_RESEND_MS = 30 * 1000; // 30 seconds
    if (nowTs - lastUpdate < MIN_RESEND_MS) {
      return { success: true, message: "OTP recently sent" };
    }
    await EmailOTP.update(payload, { where: { email } });
  } else {
    await EmailOTP.create({ email, created_at: now, ...payload });
  }

  const sendResult = await sendOtpEmail(email, otp);
  if (!sendResult.success)
    console.warn("[EmailOTP] Failed to send reset OTP", sendResult);
  return { success: true };
}

// -----------------------
// 📌 VERIFY OTP FOR A GIVEN TYPE
// -----------------------
export async function verifyOtpForType({ email, otp, otp_type }) {
  const record = await EmailOTP.findOne({ where: { email } });
  if (!record) return { success: false, message: "OTP not found" };

  if (record.otp_type !== otp_type)
    return { success: false, message: "OTP type mismatch" };

  if (record.attempt_count >= record.max_attempts)
    return { success: false, message: "Too many attempts" };

  if (new Date(record.expired_at) < new Date())
    return { success: false, message: "OTP expired" };

  const match = await bcrypt.compare(otp, record.otp_hash);
  if (!match) {
    await EmailOTP.update(
      { attempt_count: record.attempt_count + 1 },
      { where: { email } }
    );
    return { success: false, message: "OTP incorrect" };
  }

  return { success: true };
}

// -----------------------
// 📌 RESET PASSWORD BY EMAIL
// -----------------------
export async function resetPasswordByEmail({ email, new_password }) {
  const acct = await CustomersAccount.findOne({ where: { email } });
  if (!acct) return { success: false, code: 404, message: "Email not found" };

  try {
    const passHash = await bcrypt.hash(new_password, 10);
    await CustomersAccount.update(
      { password_hash: passHash },
      { where: { email } }
    );
    // delete any reset OTPs for this email
    await EmailOTP.destroy({ where: { email, otp_type: "forgot_password" } });
    return { success: true };
  } catch (err) {
    console.error("[EmailOTP] Failed to reset password", err);
    return { success: false, message: "Unable to update password" };
  }
}
