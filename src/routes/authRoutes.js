import express from "express";
import passport from "../config/passport.js";
import { refresh } from "../controllers/refreshtoken_controller.js";
import { logout } from "../controllers/logout_controller.js"; // nếu tạo
import {
  checkEmail,
  verifyOtp,
  resendOtp,
} from "../controllers/registration_controller.js";
import {
  checkEmail as forgotCheckEmail,
  verifyOtp as forgotVerifyOtp,
  resetPassword,
} from "../controllers/forgot_password.controller.js";
import { googleLoginCallback } from "../controllers/customer_auth.controller.js";

const router = express.Router();
const FRONTEND_ORIGIN = (
  process.env.FRONTEND_ORIGIN || "http://localhost:5174"
).replace(/\/$/, "");
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API quản lý token (refresh) và đăng xuất
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Làm mới access token bằng refresh token (lưu trong cookie HttpOnly)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Trả về access token mới
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Refresh token không hợp lệ hoặc đã bị thu hồi
 */
router.post("/refresh", refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất và thu hồi refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công, cookie đã bị xoá
 *       400:
 *         description: Yêu cầu không hợp lệ hoặc token không tồn tại
 */
router.post("/logout", logout);
// Registration / OTP flows
router.post("/check-email", checkEmail);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
// Forgot password flows
router.post("/forgot-password/check-email", forgotCheckEmail);
router.post("/forgot-password/verify-otp", forgotVerifyOtp);
router.post("/reset-password", resetPassword);

// Google OAuth2 alias to keep /auth routes in sync with swagger + .env
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_ORIGIN}/signin`,
  }),
  googleLoginCallback
);

export default router;
