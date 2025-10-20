import express from "express";
import {
  getAllRegions,
  getRegionById,
  getProductsByRegion,
  getProductByRegionAndId,
} from "../controllers/region_controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Regions
 *   description: API quản lý vùng đặc sản và sản phẩm theo vùng
 */

/**
 * @swagger
 * /regions:
 *   get:
 *     summary: Lấy danh sách tất cả các vùng đặc sản
 *     tags: [Regions]
 *     responses:
 *       200:
 *         description: Danh sách vùng được trả về thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   specialty_id:
 *                     type: string
 *                     example: S001
 *                   specialty_province:
 *                     type: string
 *                     example: Bình Định
 *                   specialty_description:
 *                     type: string
 *                     example: Rượu truyền thống nổi tiếng của Bình Định
 *       500:
 *         description: Lỗi server khi truy xuất danh sách vùng
 */
router.get("/", getAllRegions);

/**
 * @swagger
 * /regions/{regionId}:
 *   get:
 *     summary: Lấy thông tin chi tiết 1 vùng đặc sản
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: regionId
 *         schema:
 *           type: string
 *         required: true
 *         description: Mã vùng đặc sản (specialty_id)
 *     responses:
 *       200:
 *         description: Trả về thông tin chi tiết của vùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 specialty_id:
 *                   type: string
 *                   example: S001
 *                 specialty_province:
 *                   type: string
 *                   example: Bình Định
 *                 specialty_description:
 *                   type: string
 *                   example: Rượu truyền thống Bàu Đá
 *       404:
 *         description: Không tìm thấy vùng
 *       500:
 *         description: Lỗi server khi truy xuất vùng
 */
router.get("/:regionId", getRegionById);

/**
 * @swagger
 * /regions/{regionId}/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm thuộc vùng đặc sản
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: regionId
 *         schema:
 *           type: string
 *         required: true
 *         description: Mã vùng đặc sản
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm trong vùng
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   product_id:
 *                     type: string
 *                     example: SP002
 *                   product_name:
 *                     type: string
 *                     example: Rượu Bàu Đá
 *                   alcohol_content:
 *                     type: number
 *                     example: 40.0
 *                   volume_ml:
 *                     type: integer
 *                     example: 500
 *                   sale_price:
 *                     type: number
 *                     example: 350000
 *                   specialty_province:
 *                     type: string
 *                     example: Bình Định
 *                   primary_image:
 *                     type: string
 *                     example: uploads/products/ruoubauda.png
 *       500:
 *         description: Lỗi server khi truy xuất sản phẩm theo vùng
 */
router.get("/:regionId/products", getProductsByRegion);

/**
 * @swagger
 * /regions/{regionId}/products/{productId}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm trong vùng
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: regionId
 *         schema:
 *           type: string
 *         required: true
 *         description: Mã vùng đặc sản
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Mã sản phẩm
 *     responses:
 *       200:
 *         description: Thông tin chi tiết của sản phẩm trong vùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product_id:
 *                   type: string
 *                   example: SP002
 *                 product_name:
 *                   type: string
 *                   example: Rượu Bàu Đá Bình Định
 *                 alcohol_content:
 *                   type: number
 *                   example: 40.0
 *                 volume_ml:
 *                   type: integer
 *                   example: 500
 *                 packaging_spec:
 *                   type: string
 *                   example: "Chai thủy tinh 500ml"
 *                 sale_price:
 *                   type: number
 *                   example: 350000
 *                 description:
 *                   type: string
 *                   example: "Rượu truyền thống nấu từ gạo lứt và nước giếng Bàu Đá"
 *       404:
 *         description: Không tìm thấy sản phẩm trong vùng
 *       500:
 *         description: Lỗi server khi lấy chi tiết sản phẩm
 */
router.get("/:regionId/products/:productId", getProductByRegionAndId);

export default router;
