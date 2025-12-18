import express from "express";
import * as staffAuthController from "../controllers/staff_auth.controller.js";
import { authenticateStaff } from "../middleware/auth_middleware.js";
import { uploadStaffProfileImage } from "../middleware/upload.middleware.js";

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
 *     tags: [Staff Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffLoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffLoginResponse'
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Missing login_name or password
 */
router.post("/login", staffAuthController.loginStaff);

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
