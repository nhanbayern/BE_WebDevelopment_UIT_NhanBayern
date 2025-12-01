import express from "express";
import passport from "../config/passport.js";
import {
  loginWithPassword,
  googleLoginCallback,
} from "../controllers/customer_auth.controller.js";
import { authenticateToken } from "../middleware/auth_middleware.js";
import { getProfile } from "../controllers/profile_controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer Authentication
 *     description: API xác thực khách hàng: đăng nhập bằng email/password hoặc Google
 */

/**
 * @swagger
 * /customer/login:
 *   post:
 *     summary: Đăng nhập tài khoản khách hàng bằng email và password
 *     tags: [Customer Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: phuong.nguyen@example.com
 *               password:
 *                 type: string
 *                 example: "xinchao123"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/Customer'
 *       401:
 *         description: Sai email hoặc mật khẩu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post("/login", loginWithPassword);

/**
 * @swagger
 * /customer/profile:
 *   get:
 *     summary: Lấy thông tin profile của user đang đăng nhập
 *     tags: [Customer Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone_number:
 *                       type: string
 *                     address:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", authenticateToken, getProfile);

/**
 * @swagger
 * /customer/google:
 *   get:
 *     summary: Đăng nhập tài khoản khách hàng bằng Google OAuth2
 *     tags: [Customer Authentication]
 *     responses:
 *       302:
 *         description: Redirect tới màn hình đăng nhập Google
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    session: false,
  })
);

/**
 * @swagger
 * /customer/google/callback:
 *   get:
 *     summary: Callback Google OAuth2 cho đăng nhập thành công
 *     tags: [Customer Authentication]
 *     responses:
 *       200:
 *         description: Đăng nhập Google thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/Customer'
 *       401:
 *         description: Đăng nhập Google thất bại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  googleLoginCallback
);

export default router;
