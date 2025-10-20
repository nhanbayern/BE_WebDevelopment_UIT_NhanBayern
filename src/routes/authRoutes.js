import express from "express";
import { login, verifyToken } from "../controllers/auth_controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API xác thực người dùng
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập tài khoản nhân viên
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: manager_nhan
 *               password:
 *                 type: string
 *                 example: "123"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       400:
 *         description: Thiếu username hoặc password
 *       401:
 *         description: Sai mật khẩu
 *       403:
 *         description: Tài khoản bị khóa
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Kiểm tra token hợp lệ
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token hợp lệ
 *       401:
 *         description: Thiếu hoặc token không hợp lệ
 *       403:
 *         description: Token hết hạn
 */
router.get("/verify", verifyToken);

export default router;
