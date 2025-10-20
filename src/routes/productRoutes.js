import express from "express";
import {
  getAllProductsController,
  getProductByIdController,
  createProductController,
  updateProductController,
  deleteProductController,
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
 *     summary: Lấy danh sách tất cả sản phẩm
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Thành công — Trả về danh sách sản phẩm
 */
router.get("/", getAllProductsController);

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

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Thêm sản phẩm mới
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_name
 *               - price
 *             properties:
 *               product_name:
 *                 type: string
 *                 example: "Rượu Bàu Đá Đặc Biệt"
 *               price:
 *                 type: number
 *                 example: 150000
 *               description:
 *                 type: string
 *                 example: "Rượu truyền thống Bàu Đá hảo hạng"
 *     responses:
 *       201:
 *         description: Đã thêm sản phẩm mới thành công
 *       500:
 *         description: Lỗi khi thêm sản phẩm
 */
router.post("/", createProductController);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Cập nhật thông tin sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_name:
 *                 type: string
 *                 example: "Rượu Bàu Đá Premium"
 *               price:
 *                 type: number
 *                 example: 180000
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.put("/:id", updateProductController);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Xóa sản phẩm theo ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm cần xóa
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.delete("/:id", deleteProductController);

export default router;
