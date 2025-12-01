import express from "express";
import * as orderController from "../controllers/order.controller.js";
import { authenticateToken } from "../middleware/auth_middleware.js";

const router = express.Router();

/**
 * @openapi
 * /orders/create:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Tạo đơn hàng mới
 *     description: Tạo đơn hàng từ các sản phẩm được chọn trong giỏ hàng. Sẽ kiểm tra tồn kho, tạo order_code tự động qua trigger
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - payment_method
 *               - recipient_name
 *               - recipient_phone
 *             properties:
 *               items:
 *                 type: array
 *                 description: Danh sách sản phẩm cần đặt hàng
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - quantity
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       example: "SP001"
 *                     quantity:
 *                       type: integer
 *                       example: 3
 *               recipient_name:
 *                 type: string
 *                 description: Họ tên người nhận hiển thị trên đơn hàng
 *                 example: "Nguyễn Văn A"
 *               recipient_phone:
 *                 type: string
 *                 description: Số điện thoại liên hệ khi giao hàng
 *                 example: "0912345678"
 *               shipping_address_id:
 *                 type: integer
 *                 description: ID địa chỉ đã lưu của người dùng. Chỉ cần truyền một trong hai trường shipping_address_id hoặc shipping_address
 *                 example: 5
 *               shipping_address:
 *                 type: string
 *                 description: Địa chỉ mới nhập tại checkout (nếu không chọn địa chỉ đã lưu)
 *                 example: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
 *               payment_method:
 *                 type: string
 *                 enum: ["Cash", "OnlineBanking"]
 *                 example: "Cash"
 *     responses:
 *       201:
 *         description: Tạo đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 order_id:
 *                   type: integer
 *                   example: 123
 *                 order_code:
 *                   type: string
 *                   example: "ORD20250130-000123"
 *                 total_amount:
 *                   type: number
 *                   format: float
 *                   example: 200000
 *                 final_amount:
 *                   type: number
 *                   format: float
 *                   example: 200000
 *       400:
 *         description: Lỗi input hoặc tồn kho không đủ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   enum: ["INVALID_INPUT", "INSUFFICIENT_QUANTITY", "INVALID_ADDRESS"]
 *                 message:
 *                   type: string
 *                   example: "Số lượng bạn chọn vượt quá số lượng tồn kho"
 *                 product_id:
 *                   type: string
 *                 available:
 *                   type: integer
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Sản phẩm hoặc khách hàng không tồn tại
 *       500:
 *         description: Lỗi server
 */

/**
 * @openapi
 * /orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Lấy danh sách đơn hàng của người dùng
 *     description: Lấy tất cả đơn hàng của khách hàng đã xác thực
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       order_id:
 *                         type: integer
 *                       order_code:
 *                         type: string
 *                       customer_id:
 *                         type: string
 *                       order_status:
 *                         type: string
 *                         enum: ["Preparing", "On delivery", "Delivered"]
 *                       payment_status:
 *                         type: string
 *                         enum: ["Unpaid", "Paid"]
 *                       total_amount:
 *                         type: number
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi server
 */

/**
 * @openapi
 * /orders/{order_id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Lấy chi tiết đơn hàng
 *     description: Lấy thông tin chi tiết của một đơn hàng cụ thể
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 123
 *     responses:
 *       200:
 *         description: Chi tiết đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     order_id:
 *                       type: integer
 *                     order_code:
 *                       type: string
 *                     order_details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           detail_id:
 *                             type: integer
 *                           product_id:
 *                             type: string
 *                           quantity:
 *                             type: integer
 *                           unit_price:
 *                             type: number
 *                           total_price:
 *                             type: number
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền xem đơn hàng này
 *       404:
 *         description: Đơn hàng không tồn tại
 *       500:
 *         description: Lỗi server
 */

/**
 * @openapi
 * /orders/{order_id}/status:
 *   patch:
 *     tags:
 *       - Orders
 *     summary: Cập nhật trạng thái đơn hàng
 *     description: Cập nhật trạng thái đơn hàng (Admin/Staff only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_status
 *             properties:
 *               order_status:
 *                 type: string
 *                 enum: ["Preparing", "On delivery", "Delivered"]
 *                 example: "On delivery"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Input không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Đơn hàng không tồn tại
 *       500:
 *         description: Lỗi server
 */

/**
 * @openapi
 * /orders/{order_id}/payment-status:
 *   patch:
 *     tags:
 *       - Orders
 *     summary: Cập nhật trạng thái thanh toán
 *     description: Cập nhật trạng thái thanh toán của đơn hàng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_status
 *             properties:
 *               payment_status:
 *                 type: string
 *                 enum: ["Unpaid", "Paid"]
 *                 example: "Paid"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Input không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Đơn hàng không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post("/create", authenticateToken, orderController.createOrder);

/**
 * @route   GET /orders
 * @desc    Get all orders of authenticated user
 * @access  Private
 */
router.get("/", authenticateToken, orderController.getOrders);

/**
 * @route   GET /orders/:order_id
 * @desc    Get order detail
 * @access  Private
 */
router.get("/:order_id", authenticateToken, orderController.getOrderDetail);

/**
 * @route   PATCH /orders/:order_id/status
 * @desc    Update order status (admin/staff)
 * @access  Private
 * @body    { "order_status": "On delivery" }
 */
router.patch(
  "/:order_id/status",
  authenticateToken,
  orderController.updateOrderStatus
);

/**
 * @route   PATCH /orders/:order_id/payment-status
 * @desc    Update payment status
 * @access  Private
 * @body    { "payment_status": "Paid" }
 */
router.patch(
  "/:order_id/payment-status",
  authenticateToken,
  orderController.updatePaymentStatus
);

export default router;
