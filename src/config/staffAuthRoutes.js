import express from "express";
import * as staffAuthController from "../controllers/staff_auth.controller.js";
import { authenticateStaff } from "../middleware/auth_middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Staff Authentication
 *     description: Staff authentication and account management APIs
 *   - name: Staff - Profile
 *     description: Staff profile management APIs
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
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *     UpdateStaffProfileRequest:
 *       type: object
 *       properties:
 *         staff_name:
 *           type: string
 *         email:
 *           type: string
 *         phone_number:
 *           type: string
 *         profileimg:
 *           type: string
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
 *     tags: [Staff Authentication]
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

/**
 * @swagger
 * /staff/auth/profile:
 *   put:
 *     summary: Update current staff profile
 *     tags: [Staff - Profile]
 *     security:
 *       - StaffBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
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
 *         description: No data to update or invalid data
 *       401:
 *         description: Not authenticated
 */
router.put(
  "/profile",
  authenticateStaff,
  staffAuthController.updateStaffProfile
);

export default router;
