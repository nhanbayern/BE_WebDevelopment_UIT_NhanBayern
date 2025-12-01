import { verifyCaptcha } from "../utils/captcha.util.js";

export async function debugCaptcha(req, res) {
  try {
    const { token, remoteIp } = req.body;
    if (!token)
      return res.status(400).json({ success: false, message: "missing token" });
    const result = await verifyCaptcha(
      token,
      remoteIp || req.ip || req.connection?.remoteAddress || ""
    );
    return res.status(200).json(result);
  } catch (err) {
    console.error("debugCaptcha error", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
