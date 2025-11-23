import express from "express";
import { authenticateToken } from "../middleware/auth_middleware.js";
import { body, param } from "express-validator";
import {
  updateProfileController,
  updateAddressController,
} from "../controllers/user_controller.js";
import {
  createAddressController,
  deleteAddressController,
} from "../controllers/user_controller.js";
import { getAddressesController } from "../controllers/user_controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and shipping address management
 */

/**
 * @swagger
 * /user/update:
 *   post:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/update",
  authenticateToken,
  // optional validators
  body("username").optional().isString().isLength({ max: 100 }),
  body("phone_number").optional().isString().isLength({ max: 20 }),
  body("address").optional().isString().isLength({ max: 255 }),
  updateProfileController
);

/**
 * @swagger
 * /user/address/update/{address_id}:
 *   post:
 *     summary: Update a user's shipping address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address ID to update
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
 *                 enum: [0,1]
 *     responses:
 *       200:
 *         description: Updated address
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (address does not belong to user)
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.post(
  "/address/update/:address_id",
  authenticateToken,
  param("address_id").isInt(),
  body("address_line").optional().isString().isLength({ min: 1, max: 255 }),
  body("ward").optional().isString().isLength({ max: 50 }),
  body("district").optional().isString().isLength({ max: 50 }),
  body("province").optional().isString().isLength({ max: 50 }),
  body("is_default").optional().isInt({ min: 0, max: 1 }),
  updateAddressController
);

/**
 * @swagger
 * /user/address/create:
 *   post:
 *     summary: Create a new shipping address for current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *                 enum: [0,1]
 *     responses:
 *       201:
 *         description: Created address
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/address/create",
  authenticateToken,
  body("address_line").isString().isLength({ min: 1, max: 255 }),
  body("ward").optional().isString().isLength({ max: 50 }),
  body("district").optional().isString().isLength({ max: 50 }),
  body("province").optional().isString().isLength({ max: 50 }),
  body("is_default").optional().isInt({ min: 0, max: 1 }),
  createAddressController
);

router.get("/address", authenticateToken, getAddressesController);

/**
 * @swagger
 * /user/address/{address_id}:
 *   delete:
 *     summary: Delete a user's shipping address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address ID to delete
 *     responses:
 *       200:
 *         description: Deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/address/:address_id",
  authenticateToken,
  param("address_id").isInt(),
  deleteAddressController
);

export default router;
