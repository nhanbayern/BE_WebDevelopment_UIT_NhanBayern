import express from "express";
import { authenticateToken } from "../middleware/auth_middleware.js";
import { body, param } from "express-validator";
import {
  getCartItemsController,
  insertCartItemController,
  updateCartItemController,
  removeCartItemController,
  clearCartController,
  incrementByOneController,
  decrementByOneController,
} from "../controllers/shopping_cart.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ShoppingCart
 *   description: Shopping cart management endpoints
 */

/**
 * @swagger
 * /user/cartitems:
 *   get:
 *     summary: Get all cart items for authenticated user
 *     tags: [ShoppingCart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of cart items with product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       itemId:
 *                         type: integer
 *                         example: 1
 *                       productId:
 *                         type: string
 *                         example: "p001"
 *                       productName:
 *                         type: string
 *                         example: "Rượu Gạo Miền Bắc"
 *                       image:
 *                         type: string
 *                         example: "/img/dir/p001.png"
 *                       price:
 *                         type: number
 *                         example: 450000
 *                       quantity:
 *                         type: integer
 *                         example: 5
 *                 totalItems:
 *                   type: integer
 *                   example: 3
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Server error
 */
router.get("/cartitems", authenticateToken, getCartItemsController);

/**
 * @swagger
 * /user/insertitems:
 *   post:
 *     summary: Add item to cart or update quantity if exists (INSERT or UPDATE)
 *     description: |
 *       Uses INSERT ... ON DUPLICATE KEY UPDATE for atomic, concurrency-safe operation.
 *       If the (user_id, product_id) pair exists, quantity is incremented.
 *       Otherwise, a new cart item is created.
 *     tags: [ShoppingCart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "p001"
 *                 description: Product ID to add to cart
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *                 description: Quantity to add (will be added to existing quantity if item exists)
 *     responses:
 *       200:
 *         description: Item added or updated successfully
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
 *                   example: "Item added to cart successfully"
 *                 item:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: integer
 *                     productId:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     image:
 *                       type: string
 *                     price:
 *                       type: number
 *                     quantity:
 *                       type: integer
 *       400:
 *         description: Validation error - invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/insertitems",
  authenticateToken,
  body("productId").isString().notEmpty().withMessage("Product ID is required"),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  insertCartItemController
);

/**
 * @swagger
 * /user/cartitems/{productId}:
 *   put:
 *     summary: Update cart item quantity (set to specific value)
 *     tags: [ShoppingCart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: "p001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *                 description: New quantity (replaces existing quantity)
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.put(
  "/cartitems/:productId",
  authenticateToken,
  param("productId").isString().notEmpty(),
  body("quantity").isInt({ min: 1 }),
  updateCartItemController
);

/**
 * @swagger
 * /user/cartitems/{productId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [ShoppingCart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to remove
 *         example: "p001"
 *     responses:
 *       200:
 *         description: Item removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/cartitems/:productId",
  authenticateToken,
  param("productId").isString().notEmpty(),
  removeCartItemController
);

/**
 * @swagger
 * /user/incrementby1/{productId}:
 *   post:
 *     summary: Increment cart item quantity by 1
 *     tags: [ShoppingCart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: "P001"
 *     responses:
 *       200:
 *         description: Quantity incremented successfully
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
 *                   example: "Quantity incremented successfully"
 *                 item:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: integer
 *                     productId:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     image:
 *                       type: string
 *                     price:
 *                       type: number
 *                     quantity:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.post(
  "/incrementby1/:productId",
  authenticateToken,
  param("productId").isString().notEmpty(),
  incrementByOneController
);

/**
 * @swagger
 * /user/decrementby1/{productId}:
 *   post:
 *     summary: Decrement cart item quantity by 1 (minimum 1)
 *     tags: [ShoppingCart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: "P001"
 *     responses:
 *       200:
 *         description: Quantity decremented successfully
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
 *                   example: "Quantity decremented successfully"
 *                 item:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: integer
 *                     productId:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     image:
 *                       type: string
 *                     price:
 *                       type: number
 *                     quantity:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.post(
  "/decrementby1/:productId",
  authenticateToken,
  param("productId").isString().notEmpty(),
  decrementByOneController
);

/**
 * @swagger
 * /user/cartitems:
 *   delete:
 *     summary: Clear all cart items for authenticated user
 *     tags: [ShoppingCart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete("/cartitems", authenticateToken, clearCartController);

export default router;
