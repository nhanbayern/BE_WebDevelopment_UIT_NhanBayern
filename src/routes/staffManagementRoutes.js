import express from "express";
import * as staffManagementController from "../controllers/staff_management.controller.js";
import { authenticateStaff } from "../middleware/auth_middleware.js";
import { uploadProductImage } from "../middleware/upload.middleware.js";

const router = express.Router();

// Apply staff authentication to all routes
router.use(authenticateStaff);

/**
 * @swagger
 * tags:
 *   - name: Staff - Orders
 *     description: Staff order management APIs
 *   - name: Staff - Customers
 *     description: Staff customer management APIs
 *   - name: Staff - Products
 *     description: Staff product management APIs
 *   - name: Staff - Manufacturers
 *     description: Staff manufacturer management APIs
 *   - name: Staff - Payments
 *     description: Staff payment management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         order_id:
 *           type: integer
 *         order_code:
 *           type: string
 *         customer_id:
 *           type: string
 *         recipient_name:
 *           type: string
 *         recipient_phone:
 *           type: string
 *         shipping_address:
 *           type: string
 *         shipping_partner:
 *           type: string
 *         order_status:
 *           type: string
 *           enum: [Preparing, On delivery, Delivered, Cancelled]
 *         total_amount:
 *           type: number
 *         final_amount:
 *           type: number
 *         created_at:
 *           type: string
 *           format: date-time
 *     UpdateOrderRequest:
 *       type: object
 *       properties:
 *         order_status:
 *           type: string
 *           enum: [Preparing, On delivery, Delivered, Cancelled]
 *         shipping_partner:
 *           type: string
 *         shipping_address:
 *           type: string
 *         recipient_name:
 *           type: string
 *         recipient_phone:
 *           type: string
 *         note:
 *           type: string
 *     Customer:
 *       type: object
 *       properties:
 *         customer_id:
 *           type: string
 *         customername:
 *           type: string
 *         email:
 *           type: string
 *         phone_number:
 *           type: string
 *         profileimage:
 *           type: string
 *         login_type:
 *           type: string
 *         created_at:
 *           type: string
 *     UpdateCustomerRequest:
 *       type: object
 *       properties:
 *         customername:
 *           type: string
 *         phone_number:
 *           type: string
 *         email:
 *           type: string
 *     Product:
 *       type: object
 *       properties:
 *         product_id:
 *           type: string
 *         product_name:
 *           type: string
 *         image:
 *           type: string
 *         alcohol_content:
 *           type: number
 *         volume_ml:
 *           type: integer
 *         packaging_spec:
 *           type: string
 *         description:
 *           type: string
 *         long_description:
 *           type: string
 *         origin:
 *           type: string
 *         cost_price:
 *           type: number
 *         sale_price:
 *           type: number
 *         stock:
 *           type: integer
 *         category:
 *           type: string
 *         region:
 *           type: string
 *         manufacturer_id:
 *           type: string
 *     CreateProductRequest:
 *       type: object
 *       required:
 *         - product_name
 *         - alcohol_content
 *         - volume_ml
 *         - cost_price
 *         - sale_price
 *         - manufacturer_id
 *       properties:
 *         product_name:
 *           type: string
 *         alcohol_content:
 *           type: number
 *         volume_ml:
 *           type: integer
 *         packaging_spec:
 *           type: string
 *         description:
 *           type: string
 *         long_description:
 *           type: string
 *         origin:
 *           type: string
 *         cost_price:
 *           type: number
 *         sale_price:
 *           type: number
 *         stock:
 *           type: integer
 *         category:
 *           type: string
 *         region:
 *           type: string
 *         manufacturer_id:
 *           type: string
 *         image:
 *           type: string
 *           format: binary
 *           description: Product image file (will be uploaded to Cloudinary)
 *     Manufacturer:
 *       type: object
 *       properties:
 *         manufacturer_id:
 *           type: string
 *         manufacturer_name:
 *           type: string
 *         address:
 *           type: string
 *         province:
 *           type: string
 *         phone:
 *           type: string
 *         website:
 *           type: string
 *     CreateManufacturerRequest:
 *       type: object
 *       required:
 *         - manufacturer_name
 *       properties:
 *         manufacturer_name:
 *           type: string
 *         address:
 *           type: string
 *         province:
 *           type: string
 *         phone:
 *           type: string
 *         website:
 *           type: string
 *     Payment:
 *       type: object
 *       properties:
 *         payment_id:
 *           type: integer
 *         order_id:
 *           type: integer
 *         amount:
 *           type: number
 *         payment_method:
 *           type: string
 *           enum: [Cash, OnlineBanking]
 *         payment_status:
 *           type: string
 *           enum: [Pending, Completed, Failed]
 *         transaction_id:
 *           type: string
 *         created_at:
 *           type: string
 *     UpdatePaymentStatusRequest:
 *       type: object
 *       required:
 *         - payment_status
 *       properties:
 *         payment_status:
 *           type: string
 *           enum: [Pending, Completed, Failed]
 */

// ==================== ORDER ROUTES ====================

/**
 * @swagger
 * /staff/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Staff - Orders]
 *     security:
 *       - StaffBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Preparing, On delivery, Delivered, Cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 */
router.get("/orders", staffManagementController.getAllOrders);

/**
 * @swagger
 * /staff/orders/{order_id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Staff - Orders]
 *     security:
 *       - StaffBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get("/orders/:order_id", staffManagementController.getOrderById);

/**
 * @swagger
 * /staff/orders/{order_id}:
 *   put:
 *     summary: Update order information
 *     tags: [Staff - Orders]
 *     security:
 *       - StaffBearerAuth: []
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
 *             $ref: '#/components/schemas/UpdateOrderRequest'
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Order not found
 */
router.put("/orders/:order_id", staffManagementController.updateOrder);

// ==================== CUSTOMER ROUTES ====================

/**
 * @swagger
 * /staff/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Staff - Customers]
 *     security:
 *       - StaffBearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 customers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
 */
router.get("/customers", staffManagementController.getAllCustomers);

/**
 * @swagger
 * /staff/customers/{customer_id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Staff - Customers]
 *     security:
 *       - StaffBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer details
 *       404:
 *         description: Customer not found
 */
router.get("/customers/:customer_id", staffManagementController.getCustomerById);

/**
 * @swagger
 * /staff/customers/{customer_id}:
 *   put:
 *     summary: Update customer information (name, phone, email only)
 *     tags: [Staff - Customers]
 *     security:
 *       - StaffBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCustomerRequest'
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       400:
 *         description: Invalid data or email already exists
 *       404:
 *         description: Customer not found
 */
router.put("/customers/:customer_id", staffManagementController.updateCustomer);

// ==================== PRODUCT ROUTES ====================

/**
 * @swagger
 * /staff/products:
 *   get:
 *     summary: Get all products
 *     tags: [Staff - Products]
 *     security:
 *       - StaffBearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 */
router.get("/products", staffManagementController.getAllProducts);

/**
 * @swagger
 * /staff/products/{product_id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Staff - Products]
 *     security:
 *       - StaffBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get("/products/:product_id", staffManagementController.getProductById);

/**
 * @swagger
 * /staff/products:
 *   post:
 *     summary: Create new product with image upload
 *     tags: [Staff - Products]
 *     security:
 *       - StaffBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid data or image upload failed
 */
router.post(
  "/products",
  uploadProductImage,
  staffManagementController.createProduct
);

/**
 * @swagger
 * /staff/products/{product_id}:
 *   put:
 *     summary: Update product with optional image upload
 *     tags: [Staff - Products]
 *     security:
 *       - StaffBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid data or image upload failed
 *       404:
 *         description: Product not found
 */
router.put(
  "/products/:product_id",
  uploadProductImage,
  staffManagementController.updateProduct
);

/**
 * @swagger
 * /staff/products/{product_id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Staff - Products]
 *     security:
 *       - StaffBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       400:
 *         description: Cannot delete product
 *       404:
 *         description: Product not found
 */
router.delete(
  "/products/:product_id",
  staffManagementController.deleteProduct
);

// ==================== MANUFACTURER ROUTES ====================

/**
 * @swagger
 * /staff/manufacturers:
 *   get:
 *     summary: Get all manufacturers
 *     tags: [Staff - Manufacturers]
 *     security:
 *       - StaffBearerAuth: []
 *     responses:
 *       200:
 *         description: List of manufacturers
 */
router.get("/manufacturers", staffManagementController.getAllManufacturers);

/**
 * @swagger
 * /staff/manufacturers:
 *   post:
 *     summary: Create new manufacturer
 *     tags: [Staff - Manufacturers]
 *     security:
 *       - StaffBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateManufacturerRequest'
 *     responses:
 *       201:
 *         description: Manufacturer created successfully
 */
router.post(
  "/manufacturers",
  staffManagementController.createManufacturer
);

/**
 * @swagger
 * /staff/manufacturers/{manufacturer_id}:
 *   put:
 *     summary: Update manufacturer
 *     tags: [Staff - Manufacturers]
 *     security:
 *       - StaffBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturer_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateManufacturerRequest'
 *     responses:
 *       200:
 *         description: Manufacturer updated successfully
 */
router.put(
  "/manufacturers/:manufacturer_id",
  staffManagementController.updateManufacturer
);

/**
 * @swagger
 * /staff/manufacturers/{manufacturer_id}:
 *   delete:
 *     summary: Delete manufacturer
 *     tags: [Staff - Manufacturers]
 *     security:
 *       - StaffBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturer_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Manufacturer deleted successfully
 *       400:
 *         description: Cannot delete manufacturer with existing products
 */
router.delete(
  "/manufacturers/:manufacturer_id",
  staffManagementController.deleteManufacturer
);

// ==================== PAYMENT ROUTES ====================

/**
 * @swagger
 * /staff/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Staff - Payments]
 *     security:
 *       - StaffBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Completed, Failed]
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [Cash, OnlineBanking]
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get("/payments", staffManagementController.getAllPayments);

/**
 * @swagger
 * /staff/payments/{payment_id}:
 *   put:
 *     summary: Update payment status
 *     tags: [Staff - Payments]
 *     security:
 *       - StaffBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payment_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePaymentStatusRequest'
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Payment not found
 */
router.put(
  "/payments/:payment_id",
  staffManagementController.updatePaymentStatus
);

export default router;
