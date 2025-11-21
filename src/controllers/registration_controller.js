import * as emailOtpService from "../services/email_otp.service.js";
import Customer from "../models/user.model.js";
import EmailOTP from "../models/email_otp.model.js";

// POST /auth/check-email
export async function checkEmail(req, res) {
  try {
    const { email } = req.body;
    const result = await emailOtpService.createAndSendOtp({
      email,
      ip: req.ip || req.connection.remoteAddress,
      user_agent: req.headers["user-agent"],
    });
    if (!result.success) {
      return res
        .status(result.code || 400)
        .json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /auth/verify-otp
export async function verifyOtp(req, res) {
  try {
    const { email, otp, username, password, phone } = req.body;
    const result = await emailOtpService.verifyOtp({ email, otp });
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    // create user and login
    // If username not provided, derive from email
    const finalUsername = username || email.split("@")[0];
    const login = await emailOtpService.finalizeRegistration({
      email,
      username: finalUsername,
      ip: req.ip || req.connection.remoteAddress,
      user_agent: req.headers["user-agent"],
      res,
      password,
      phone,
    });
    return res
      .status(200)
      .json({ success: true, message: "Registered", ...login });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /auth/resend-otp
export async function resendOtp(req, res) {
  try {
    const { email } = req.body;
    const out = await emailOtpService.resendOtp({
      email,
      ip: req.ip || req.connection.remoteAddress,
      user_agent: req.headers["user-agent"],
    });
    if (!out.success) {
      return res.status(400).json({ success: false, message: out.message });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}
