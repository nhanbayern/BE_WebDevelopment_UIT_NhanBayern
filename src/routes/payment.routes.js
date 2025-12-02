import express from "express";
import { createMomoPayment, handleMomoIpn } from "../controllers/payment.controller.js";
import { authenticateToken } from "../middleware/auth_middleware.js";

const router = express.Router();

/**
 * @openapi
 * /payment/momo/create:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Khởi tạo phiên thanh toán MoMo
 *     description: Backend kiểm tra order_code thuộc về người dùng hiện tại, đảm bảo phương thức là OnlineBanking & trạng thái Unpaid trước khi sinh payment URL của MoMo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_codes:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *                 description: order_code hoặc danh sách order_code cần thanh toán
 *                 example:
 *                   - "ORD20251201-000010"
 *                   - "ORD20251201-000011"
 *           example:
 *             order_codes:
 *               - "ORD20251201-000010"
 *               - "ORD20251201-000011"
 *     responses:
 *       200:
 *         description: Tạo payment URL thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentUrl:
 *                       type: string
 *                       example: "https://test-payment.momo.vn/pay/TRANSID"
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["ORD-20251201-001", "ORD-20251202-004"]
 *                     orderCount:
 *                       type: integer
 *                       example: 2
 *                     amount:
 *                       type: number
 *                       example: 300000
 *       400:
 *         description: Thiếu order_codes hoặc đơn hàng không hợp lệ / không thuộc về người dùng
 *       500:
 *         description: Lỗi máy chủ
 *     security:
 *       - bearerAuth: []
 */
router.post("/momo/create", authenticateToken, createMomoPayment);

/**
 * @openapi
 * /payment/momo/ipn:
 *   post:
 *     tags:
 *       - Payments
 *     summary: MoMo IPN callback
 *     description: MoMo gọi vào endpoint này để thông báo kết quả giao dịch. Backend cần xác thực chữ ký và cập nhật trạng thái đơn hàng.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partnerCode:
 *                 type: string
 *               orderId:
 *                 type: string
 *               requestId:
 *                 type: string
 *               amount:
 *                 type: integer
 *               resultCode:
 *                 type: integer
 *               message:
 *                 type: string
 *               payType:
 *                 type: string
 *               responseTime:
 *                 type: integer
 *               extraData:
 *                 type: string
 *                 description: Danh sách order_code (dạng chuỗi phân cách bởi dấu phẩy)
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Hệ thống ghi nhận IPN hợp lệ
 *       400:
 *         description: Chữ ký không hợp lệ
 */
router.post("/momo/ipn", handleMomoIpn);

export default router;
