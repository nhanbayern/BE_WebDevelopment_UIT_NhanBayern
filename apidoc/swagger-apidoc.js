import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cửa hàng rượu Ông Tư API Docs",
      version: "1.0.0",
      description: "Tài liệu API cho hệ thống quản lý rượu",
    },
    servers: [
      {
        url: "https://api.ruouongtu.me/RuouOngTu",
        description: "Production API (NGINX → Node.js)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Customer: {
          type: "object",
          description: "Bảng customers lưu thông tin khách hàng",
          properties: {
            customer_id: { 
              type: "string", 
              example: "C202512170001",
              description: "Customer ID (primary key)"
            },
            customername: { 
              type: "string", 
              example: "Nguyễn Văn A",
              description: "Customer's full name"
            },
            username: { 
              type: "string", 
              example: "Nguyễn Văn A",
              description: "Backward compatibility alias for customername"
            },
            user_id: { 
              type: "string", 
              example: "C202512170001",
              description: "Backward compatibility alias for customer_id"
            },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            phone_number: {
              type: "string",
              nullable: true,
              example: "0987654321",
            },
            profileimage: {
              type: "string",
              nullable: true,
              example: "https://res.cloudinary.com/dloe5xhbi/image/upload/v1234567890/avatars/C202512170001.jpg",
              description: "Avatar URL from Cloudinary"
            },
            google_id: {
              type: "string",
              nullable: true,
              example: "110234567890123456789",
            },
            login_type: {
              type: "string",
              enum: ["google", "password"],
              example: "password",
              description: "Authentication method"
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2025-12-01T10:15:00Z",
            },
          },
          required: ["customer_id", "customername", "email"],
        },
        CustomerAccount: {
          type: "object",
          description: "Bảng customers_account quản lý thông tin đăng nhập",
          properties: {
            account_id: { type: "string", example: "ACCuser001" },
            user_id: { type: "string", example: "user001" },
            login_type: {
              type: "string",
              enum: ["google", "password"],
              example: "password",
            },
            email: {
              type: "string",
              format: "email",
              nullable: true,
              example: "user@example.com",
            },
            password_hash: {
              type: "string",
              nullable: true,
              example: "$2a$10$abc...",
            },
            google_id: {
              type: "string",
              nullable: true,
              example: "110234567890123456789",
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2025-12-01T10:15:00Z",
            },
          },
          required: ["account_id", "user_id", "login_type"],
        },
        EmailOtp: {
          type: "object",
          description: "Bảng emailotp lưu mã OTP",
          properties: {
            id: { type: "integer", format: "int64", example: 15 },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            otp_type: {
              type: "string",
              enum: [
                "register",
                "forgot_password",
                "change_email",
                "2fa",
              ],
              example: "register",
            },
            otp_hash: {
              type: "string",
              example: "8ac45f...",
            },
            expired_at: {
              type: "string",
              format: "date-time",
              example: "2025-12-01T10:20:00Z",
            },
            attempt_count: { type: "integer", example: 0 },
            max_attempts: { type: "integer", example: 5 },
            resend_count: { type: "integer", example: 1 },
            resend_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            ip_address: {
              type: "string",
              nullable: true,
              example: "203.113.123.10",
            },
            user_agent: {
              type: "string",
              nullable: true,
              example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            },
            device_fingerprint: {
              type: "string",
              nullable: true,
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
          required: ["id", "email", "otp_hash", "expired_at"],
        },
        LoginLog: {
          type: "object",
          properties: {
            log_id: { type: "integer", example: 120 },
            session_id: { type: "integer", nullable: true },
            account_id: { type: "string", nullable: true },
            input_username: { type: "string", nullable: true },
            username: { type: "string", example: "user001" },
            ip_address: { type: "string", example: "203.113.0.10" },
            user_agent: { type: "string", nullable: true },
            login_time: {
              type: "string",
              format: "date-time",
            },
            logout_time: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            status: {
              type: "string",
              enum: ["success", "failed", "logout"],
            },
            error_message: { type: "string", nullable: true },
          },
          required: ["log_id", "username", "ip_address", "status"],
        },
        Manufacturer: {
          type: "object",
          properties: {
            manufacturer_id: { type: "string", example: "MFG01" },
            manufacturer_name: {
              type: "string",
              example: "Rượu Ông Tư Co.",
            },
            address: { type: "string", nullable: true },
            province: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            website: { type: "string", nullable: true },
          },
          required: ["manufacturer_id", "manufacturer_name"],
        },
        Product: {
          type: "object",
          properties: {
            product_id: { type: "string", example: "SP001" },
            product_name: { type: "string", example: "Rượu Nếp 1945" },
            image: {
              type: "string",
              nullable: true,
              example: "https://cdn.../products/sp001.jpg",
            },
            alcohol_content: { type: "number", format: "float", example: 40 },
            volume_ml: { type: "integer", example: 750 },
            packaging_spec: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            long_description: { type: "string", nullable: true },
            origin: { type: "string", example: "Việt Nam" },
            cost_price: { type: "number", format: "float", example: 120000 },
            sale_price: { type: "number", format: "float", example: 150000 },
            stock: { type: "integer", example: 50 },
            category: { type: "string", nullable: true, example: "Rượu gạo" },
            region: { type: "string", nullable: true },
            manufacturer_id: { type: "string", example: "MFG01" },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
          required: [
            "product_id",
            "product_name",
            "alcohol_content",
            "volume_ml",
            "cost_price",
            "sale_price",
            "manufacturer_id",
          ],
        },
        Order: {
          type: "object",
          properties: {
            order_id: { type: "integer", example: 25 },
            order_code: { type: "string", example: "ORD20251201-000025" },
            customer_id: { type: "string", example: "user001" },
            shipping_address: { type: "string", example: "123 Lê Lợi, Q1" },
            shipping_partner: {
              type: "string",
              example: "Local",
              default: "Local",
            },
            order_status: {
              type: "string",
              enum: ["Preparing", "On delivery", "Delivered"],
              example: "Preparing",
            },
            payment_method: {
              type: "string",
              enum: ["Cash", "OnlineBanking"],
              example: "OnlineBanking",
            },
            payment_status: {
              type: "string",
              enum: ["Unpaid", "Paid"],
              example: "Unpaid",
            },
            total_amount: { type: "number", format: "float", example: 450000 },
            final_amount: { type: "number", format: "float", example: 420000 },
            created_at: {
              type: "string",
              format: "date-time",
            },
          },
          required: [
            "order_id",
            "customer_id",
            "payment_method",
            "total_amount",
            "final_amount",
          ],
        },
        OrderDetail: {
          type: "object",
          properties: {
            detail_id: { type: "integer", example: 12 },
            order_id: { type: "integer", example: 25 },
            product_id: { type: "string", example: "SP001" },
            quantity: { type: "integer", example: 2 },
            unit_price: { type: "number", format: "float", example: 150000 },
            total_price: { type: "number", format: "float", example: 300000 },
          },
          required: [
            "detail_id",
            "order_id",
            "product_id",
            "quantity",
            "unit_price",
            "total_price",
          ],
        },
        Payment: {
          type: "object",
          properties: {
            payment_id: { type: "integer", example: 10 },
            order_id: { type: "integer", example: 25 },
            amount: { type: "number", format: "float", example: 420000 },
            payment_method: {
              type: "string",
              enum: ["Cash", "OnlineBanking"],
            },
            payment_status: {
              type: "string",
              enum: ["Pending", "Completed", "Failed"],
            },
            transaction_id: {
              type: "string",
              nullable: true,
              example: "TX20251201-000010",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
          },
          required: ["payment_id", "order_id", "amount"],
        },
        RefreshToken: {
          type: "object",
          properties: {
            session_id: { type: "integer", example: 210 },
            token_hash: { type: "string" },
            user_id: { type: "string", example: "C202512170001", description: "customer_id or staff_id" },
            device_info: { type: "string", nullable: true },
            ip_address: {
              type: "string",
              nullable: true,
              example: "203.113.0.10",
            },
            expires_at: {
              type: "string",
              format: "date-time",
            },
            revoked: { type: "boolean", example: false },
            revoked_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            last_used_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
          required: ["session_id", "token_hash", "user_id", "expires_at"],
        },
        ShoppingCartItem: {
          type: "object",
          properties: {
            item_id: { type: "integer", example: 5 },
            customer_id: { type: "string", example: "C202512170001" },
            product_id: { type: "string", example: "SP001" },
            quantity: { type: "integer", example: 3 },
          },
          required: ["item_id", "customer_id", "product_id", "quantity"],
        },
        CustomerAddress: {
          type: "object",
          description: "Địa chỉ giao hàng của khách hàng",
          properties: {
            address_id: { type: "integer", example: 7 },
            customer_id: { type: "string", example: "C202512170001" },
            address_line: { type: "string", example: "123 Lê Lợi" },
            ward: { type: "string", nullable: true, example: "Bến Nghé" },
            district: { type: "string", nullable: true, example: "Quận 1" },
            province: { type: "string", nullable: true, example: "TP.HCM" },
            is_default: { type: "integer", example: 1, description: "1 = default, 0 = not default" },
            address_code: {
              type: "string",
              nullable: true,
              example: "AddressC202512170001001",
            },
          },
          required: ["address_id", "customer_id", "address_line"],
        },
      },
    },
  },

  security: [
    {
      bearerAuth: [],
    },
  ],

  // Document all route files so new endpoints are automatically included
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default (app) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        persistAuthorization: true, // Giữ token sau reload
        requestInterceptor: (req) => {
          console.log("📦 Swagger gửi headers:", req.headers); // 🔍 Log trong console
          return req;
        },
      },
    })
  );
};
