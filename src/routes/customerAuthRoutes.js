import express from "express";
import passport from "../config/passport.js";
import {
  loginWithPassword,
  googleLoginCallback,
} from "../controllers/customer_auth.controller.js";
import { authenticateToken } from "../middleware/auth_middleware.js";
import upload from "../middleware/upload.middleware.js";
import { body, param } from "express-validator";
import {
  getProfile,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/customer_controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer Authentication
 *     description: "API xác thực khách hàng: đăng nhập bằng email/password hoặc Google"
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
 *     summary: Lấy thông tin profile của customer đang đăng nhập
 *     tags: [Customer Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin customer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     customer_id:
 *                       type: string
 *                       example: "C202512170001"
 *                     customername:
 *                       type: string
 *                       example: "Nguyễn Văn A"
 *                     username:
 *                       type: string
 *                       example: "Nguyễn Văn A"
 *                       description: "Backward compatibility alias"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     phone_number:
 *                       type: string
 *                       example: "0987654321"
 *                     profileimage:
 *                       type: string
 *                       example: "https://res.cloudinary.com/dloe5xhbi/image/upload/v1234567890/avatars/C202512170001.jpg"
 *                       description: "Avatar URL from Cloudinary"
 *                     google_id:
 *                       type: string
 *                       nullable: true
 *                     login_type:
 *                       type: string
 *                       enum: ["google", "password"]
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.get("/profile", authenticateToken, getProfile);

/**
 * @swagger
 * /customer/update:
 *   post:
 *     summary: Cập nhật thông tin profile (hỗ trợ upload avatar)
 *     tags: [Customer Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh đại diện (JPEG, PNG, GIF, WebP, max 5MB)
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               phone_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Lỗi validation
 *       401:
 *         description: Chưa đăng nhập
 */
router.post(
  "/update",
  authenticateToken,
  (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
      if (err) {
        console.error("❌ Multer error:", err);
        return res.status(400).json({ message: err.message });
      }
      console.log("✅ Multer passed, file:", req.file ? "YES" : "NO");
      next();
    });
  },
  [
    body("username").optional().isString().trim().notEmpty(),
    body("phone_number").optional().isString().trim(),
  ],
  updateProfile
);

/**
 * @swagger
 * /customer/addresses:
 *   get:
 *     summary: Lấy danh sách địa chỉ của customer
 *     tags: [Customer Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách địa chỉ
 *       401:
 *         description: Chưa đăng nhập
 */
router.get("/addresses", authenticateToken, getAddresses);

/**
 * @swagger
 * /customer/addresses:
 *   post:
 *     summary: Tạo địa chỉ mới
 *     tags: [Customer Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address_line
 *             properties:
 *               address_line:
 *                 type: string
 *               ward:
 *                 type: string
 *               district:
 *                 type: string
 *               province:
 *                 type: string
 *               is_default:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tạo địa chỉ thành công
 *       400:
 *         description: Lỗi validation
 *       401:
 *         description: Chưa đăng nhập
 */
router.post(
  "/addresses",
  authenticateToken,
  [
    body("address_line").isString().trim().notEmpty(),
    body("ward").optional().isString().trim(),
    body("district").optional().isString().trim(),
    body("province").optional().isString().trim(),
    body("is_default").optional().isInt(),
  ],
  createAddress
);

/**
 * @swagger
 * /customer/addresses/{address_id}:
 *   put:
 *     summary: Cập nhật địa chỉ
 *     tags: [Customer Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address_line:
 *                 type: string
 *               ward:
 *                 type: string
 *               district:
 *                 type: string
 *               province:
 *                 type: string
 *               is_default:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Lỗi validation
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy địa chỉ
 */
router.put(
  "/addresses/:address_id",
  authenticateToken,
  [
    param("address_id").isInt(),
    body("address_line").optional().isString().trim().notEmpty(),
    body("ward").optional().isString().trim(),
    body("district").optional().isString().trim(),
    body("province").optional().isString().trim(),
    body("is_default").optional().isInt(),
  ],
  updateAddress
);

/**
 * @swagger
 * /customer/addresses/{address_id}:
 *   delete:
 *     summary: Xóa địa chỉ
 *     tags: [Customer Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy địa chỉ
 */
router.delete(
  "/addresses/:address_id",
  authenticateToken,
  [param("address_id").isInt()],
  deleteAddress
);

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
// thiện nhân đẹp trai
