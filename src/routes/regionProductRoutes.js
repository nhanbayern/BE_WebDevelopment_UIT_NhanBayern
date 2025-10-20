import express from "express";
import regionController from "../controllers/region_controller.js";

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Region Products
 *   description: API sản phẩm theo vùng
 */

// Lấy danh sách sản phẩm trong vùng
/**
 * @swagger
 * /regions/{regionId}/products:
 *   get:
 *     summary: Lấy tất cả sản phẩm thuộc một vùng
 *     tags: [Region Products]
 *     parameters:
 *       - in: path
 *         name: regionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của vùng
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm theo vùng
 */
router.get("/", regionController.getProductsByRegion);

// Lấy chi tiết sản phẩm trong vùng
/**
 * @swagger
 * /regions/{regionId}/products/{productId}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm trong vùng
 *     tags: [Region Products]
 *     parameters:
 *       - in: path
 *         name: regionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin chi tiết sản phẩm trong vùng
 */
router.get("/:productId", regionController.getProductByRegionAndId);

export default router;
