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
        description: "Local Server",
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
    },
  },

  security: [
    {
      bearerAuth: [],
    },
  ],

  apis: [
    "./src/routes/productRoutes.js",
    "./src/routes/regionRoutes.js",
    "./src/routes/authRoutes.js",
  ],
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
