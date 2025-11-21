import express from "express";
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

const router = express.Router();
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
export default router;
