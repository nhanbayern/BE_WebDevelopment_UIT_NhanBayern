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
  process.env.FRONTEND_ORIGIN || "https://api.ruouongtu.me"
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
/**
 * @swagger
 * /auth/check-email:
 *   post:
 *     summary: Kiểm tra email đăng ký và gửi OTP
 *     description: Kiểm tra xem email đã tồn tại chưa và phát sinh OTP 6 số, gửi về email để xác thực trước khi tạo tài khoản.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP đã được gửi qua email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent"
 *       400:
 *         description: Email không hợp lệ hoặc không thể gửi OTP
 */
router.post("/check-email", checkEmail);
/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Xác thực OTP và hoàn tất đăng ký
 *     description: Nhập OTP vừa gửi qua email cùng thông tin tài khoản để tạo user mới và tự động đăng nhập.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               username:
 *                 type: string
 *                 description: Tuỳ chọn, hệ thống sẽ tự tạo nếu bỏ trống
 *                 example: "user123"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Passw0rd!"
 *               phone:
 *                 type: string
 *                 example: "0987654321"
 *     responses:
 *       200:
 *         description: Đăng ký thành công và trả về thông tin đăng nhập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Registered"
 *                 accessToken:
 *                   type: string
 *                   description: Có mặt nếu finalizeRegistration trả về token
 *       400:
 *         description: OTP sai/đã hết hạn hoặc dữ liệu không hợp lệ
 */
router.post("/verify-otp", verifyOtp);
/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Gửi lại OTP đăng ký
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP mới đã được gửi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Không thể gửi lại OTP do vượt giới hạn hoặc email không hợp lệ
 */
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
    prompt: "select_account",
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
