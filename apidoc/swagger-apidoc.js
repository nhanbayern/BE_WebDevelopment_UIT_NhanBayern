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
        url: "http://localhost:3000/RuouOngTu",
        description: "Local Server (RuouOngTu base)",
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
          properties: {
            id: { type: "string", example: "643f1a2b3c4d5e6f7g8h9i" },
            username: { type: "string", example: "john_doe" },
            email: { type: "string", example: "john@example.com" },
            role: { type: "string", example: "customer" },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2025-11-18T12:34:56Z",
            },
          },
          required: ["id", "username", "email"],
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
