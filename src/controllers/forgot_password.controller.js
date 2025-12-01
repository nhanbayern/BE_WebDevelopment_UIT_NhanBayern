import * as emailOtpService from "../services/email_otp.service.js";

export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Missing email" });
    const result = await emailOtpService.createAndSendResetOtp({ email });
    if (result.success) return res.status(200).json({ success: true });
    if (result.code === 404)
      return res.status(404).json({ success: false, message: result.message });
    return res
      .status(500)
      .json({ success: false, message: result.message || "Failed" });
  } catch (err) {
    console.error("forgot.checkEmail error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res
        .status(400)
        .json({ success: false, message: "Missing params" });
    const result = await emailOtpService.verifyOtpForType({
      email,
      otp,
      otp_type: "forgot_password",
    });
    if (result.success) return res.status(200).json({ success: true });
    return res.status(400).json({ success: false, message: result.message });
  } catch (err) {
    console.error("forgot.verifyOtp error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, new_password } = req.body;
    if (!email || !new_password)
      return res
        .status(400)
        .json({ success: false, message: "Missing params" });
    const result = await emailOtpService.resetPasswordByEmail({
      email,
      new_password,
    });
    if (result.success)
      return res
        .status(200)
        .json({ success: true, message: "Password updated" });
    if (result.code === 404)
      return res.status(404).json({ success: false, message: result.message });
    return res.status(500).json({
      success: false,
      message: result.message || "Failed to update password",
    });
  } catch (err) {
    console.error("forgot.resetPassword error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export default { checkEmail, verifyOtp, resetPassword };
