import express from "express";
import * as staffAuthController from "../controllers/staff_auth.controller.js";
import { authenticateStaff } from "../middleware/auth_middleware.js";
import { uploadStaffProfileImage } from "../middleware/upload.middleware.js";
import { refreshStaffToken } from "../controllers/staff_refresh_token.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Staff Authentication
 *     description: Staff authentication and account management APIs
 *   - name: Staff Profile
 *     description: Staff profile management APIs (view and update profile information)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     StaffLoginRequest:
 *       type: object
 *       required:
 *         - login_name
 *         - password
 *       properties:
 *         login_name:
 *           type: string
 *           example: "admin01"
 *         password:
 *           type: string
 *           example: "password123"
 *     StaffLoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         accessToken:
 *           type: string
 *         staff:
 *           $ref: '#/components/schemas/StaffProfile'
 *     StaffProfile:
 *       type: object
 *       properties:
 *         staff_id:
 *           type: string
 *         login_name:
 *           type: string
 *         staff_name:
 *           type: string
 *         email:
 *           type: string
 *         phone_number:
 *           type: string
 *         position:
 *           type: string
 *         profileimg:
 *           type: string
 *           description: URL of staff profile image
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - oldPassword
 *         - newPassword
 *       properties:
 *         oldPassword:
 *           type: string
 *         newPassword:
 *           type: string
 *     CreateStaffRequest:
 *       type: object
 *       required:
 *         - login_name
 *         - password
 *         - staff_name
 *       properties:
 *         login_name:
 *           type: string
 *         password:
 *           type: string
 *         staff_name:
 *           type: string
 *         email:
 *           type: string
 *         phone_number:
 *           type: string
 *         position:
 *           type: string
 *     UpdateStaffProfileRequest:
 *       type: object
 *       properties:
 *         staff_name:
 *           type: string
 *           description: Staff full name
 *         email:
 *           type: string
 *           description: Staff email address
 *         phone_number:
 *           type: string
 *           description: Staff phone number
 *         profileimg:
 *           type: string
 *           description: URL of staff profile image
 *   securitySchemes:
 *     StaffBearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /staff/auth/login:
 *   post:
 *     summary: Staff login
 *     description: Authenticate staff and receive access token (15 minutes) and refresh token (30 days in HttpOnly cookie)
 *     tags: [Staff Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffLoginRequest'
 *     responses:
 *       200:
 *         description: Login successful. Refresh token is set as HttpOnly cookie named 'staffRefreshToken'
 *         headers:
 *           Set-Cookie:
 *             description: Refresh token stored in HttpOnly cookie
 *             schema:
 *               type: string
 *               example: staffRefreshToken=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffLoginResponse'
 *             example:
 *               success: true
 *               message: "Đăng nhập thành công"
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               staff:
 *                 staff_id: "staff001"
 *                 login_name: "admin01"
 *                 staff_name: "Admin User"
 *                 email: "admin@example.com"
 *                 phone_number: "0123456789"
 *                 position: "Manager"
 *                 status: "ACTIVE"
 *       401:
 *         description: Invalid credentials or account inactive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Mật khẩu không đúng"
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Vui lòng cung cấp tên đăng nhập và mật khẩu"
 */
router.post("/login", staffAuthController.loginStaff);

/**
 * @swagger
 * /staff/auth/logout:
 *   post:
 *     summary: Staff logout
 *     description: |
 *       Logout the authenticated staff member by revoking the refresh token.
 *       
 *       **Actions:**
 *       - Revoke the refresh token (mark as revoked in database)
 *       - Update login logs with logout_time and status='logout'
 *       - Clear the staffRefreshToken cookie
 *       
 *       **Usage:**
 *       - Called when staff clicks logout button
 *       - Refresh token stored in HttpOnly cookie (no body needed)
 *       - Prevents reuse of revoked token
 *     tags: [Staff Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: "Đăng xuất thành công"
 *       400:
 *         description: Refresh token not provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Refresh token không được cung cấp"
 *       500:
 *         description: Server error during logout
 */
router.post("/logout", staffAuthController.logoutStaff);

/**
 * @swagger
 * /staff/auth/refresh:
 *   post:
 *     summary: Refresh staff access token
 *     description: |
 *       Use refresh token (from HttpOnly cookie 'staffRefreshToken') to get new access token.
 *       
 *       **Token Expiry:**
 *       - Access Token: 15 minutes
 *       - Refresh Token: 30 days
 *       
 *       **Usage:**
 *       - Automatically called by frontend when access token expires
 *       - Refresh token stored in HttpOnly cookie (secure)
 *       - Returns new 15-minute access token without re-login
 *     tags: [Staff Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: New access token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                   description: New JWT access token (valid for 15 minutes)
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 staff:
 *                   $ref: '#/components/schemas/StaffProfile'
 *             example:
 *               success: true
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               staff:
 *                 staff_id: "staff001"
 *                 login_name: "admin01"
 *                 staff_name: "Admin User"
 *                 email: "admin@example.com"
 *                 phone_number: "0123456789"
 *                 position: "Manager"
 *                 profileimg: "https://res.cloudinary.com/..."
 *                 status: "ACTIVE"
 *       401:
 *         description: Refresh token invalid, expired, or revoked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Refresh token không tồn tại"
 *       500:
 *         description: Server error
 */
router.post("/refresh", refreshStaffToken);

/**
 * @swagger
 * /staff/auth/profile:
 *   get:
 *     summary: Get current staff profile
 *     description: Retrieve the profile information of the authenticated staff member, including profile image
 *     tags: [Staff Profile]
 *     security:
 *       - StaffBearerAuth: []
 *     responses:
 *       200:
 *         description: Staff profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 staff:
 *                   $ref: '#/components/schemas/StaffProfile'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Staff not found
 */
router.get("/profile", authenticateStaff, staffAuthController.getStaffProfile);

/**
 * @swagger
 * /staff/auth/profile:
 *   put:
 *     summary: Update staff profile
 *     description: Update the profile information of the authenticated staff member (name, email, phone, profile image upload)
 *     tags: [Staff Profile]
 *     security:
 *       - StaffBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               staff_name:
 *                 type: string
 *                 description: Staff full name
 *               email:
 *                 type: string
 *                 description: Staff email address
 *               phone_number:
 *                 type: string
 *                 description: Staff phone number
 *               profileimg:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (JPEG, PNG, GIF, WebP, max 5MB)
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStaffProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 staff:
 *                   $ref: '#/components/schemas/StaffProfile'
 *       400:
 *         description: No data to update, invalid input, or invalid file type
 *       401:
 *         description: Not authenticated
 */
router.put(
  "/profile",
  authenticateStaff,
  (req, res, next) => {
    uploadStaffProfileImage(req, res, (err) => {
      if (err) {
        console.error("❌ Multer error:", err);
        return res.status(400).json({ 
          success: false,
          message: err.message 
        });
      }
      console.log("✅ Multer passed, file:", req.file ? "YES" : "NO");
      next();
    });
  },
  staffAuthController.updateStaffProfile
);

/**
 * @swagger
 * /staff/auth/change-password:
 *   post:
 *     summary: Change staff password
 *     tags: [Staff Authentication]
 *     security:
 *       - StaffBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid old password or missing fields
 *       401:
 *         description: Not authenticated
 */
router.post(
  "/change-password",
  authenticateStaff,
  staffAuthController.changePassword
);

/**
 * @swagger
 * /staff/auth/create:
 *   post:
 *     summary: Create new staff account
 *     tags: [Staff Authentication]
 *     security:
 *       - StaffBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStaffRequest'
 *     responses:
 *       201:
 *         description: Staff account created successfully
 *       400:
 *         description: Missing required fields or login_name already exists
 *       401:
 *         description: Not authenticated
 */
router.post(
  "/create",
  authenticateStaff,
  staffAuthController.createStaffAccount
);

export default router;
