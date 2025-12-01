import express from "express";
import {
  getAllProductsController,
  getProductByIdController,
  getProductsByRegionController,
} from "../controllers/product_controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API quản lý sản phẩm
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Lấy danh sách tất cả sản phẩm (có phân trang, tìm kiếm, và lọc)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang (bắt đầu từ 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng sản phẩm trên mỗi trang
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm theo tên sản phẩm (LIKE %keyword%)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo danh mục sản phẩm
 *     responses:
 *       200:
 *         description: Thành công — Trả về danh sách sản phẩm có phân trang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalItems:
 *                   type: integer
 *                   example: 50
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/", getAllProductsController);

/**
 * @swagger
 * /products/region/{regionName}:
 *   get:
 *     summary: Lấy danh sách sản phẩm theo region
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: regionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên region (trùng với cột `region` trong view)
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm thuộc region
 */
router.get("/region/:regionName", getProductsByRegionController);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết của một sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Thành công — Trả về sản phẩm tương ứng
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get("/:id", getProductByIdController);

export default router;
