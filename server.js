import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// passport configuration
import passport from "./src/config/passport.js";
import productRoutes from "./src/routes/productRoutes.js";
import regionRoutes from "./src/routes/regionRoutes.js"; // 👈 mới thêm
// Đảm bảo chỉ import customerAuthRoutes, xoá các dòng liên quan đến authRoutes nếu có
import customerAuthRoutes from "./src/routes/customerAuthRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
//  Import swagger config
import setupSwagger from "./apidoc/swagger-apidoc.js";

dotenv.config();

const app = express();
// Middleware setup
// CORS: cho phép cookie (credentials) từ frontend origin cấu hình
// Trim trailing slash if user set FRONTEND_ORIGIN with a slash (causes CORS mismatch)
const FRONTEND_ORIGIN = (
  process.env.FRONTEND_ORIGIN || "http://localhost:3000"
).replace(/\/$/, "");
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

// Debug middleware: log incoming origin and configured allowed origin
app.use((req, res, next) => {
  const origin = req.headers.origin || "-";
  console.log(
    `[CORS DEBUG] ${req.method} ${req.url} - request origin: ${origin} | allowed origin: ${FRONTEND_ORIGIN}`
  );
  next();
});
// parse cookies (để đọc HttpOnly refresh token)
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use(passport.initialize());
// Swagger setup
setupSwagger(app);

// Routes setup
app.use("/RuouOngTu/products", productRoutes);
app.use("/RuouOngTu/regions", regionRoutes); // dòng này để bật route region/products
// Mount customer routes under the RuouOngTu base (canonical)
app.use("/RuouOngTu/api/customer", customerAuthRoutes);
// Backwards-compatible mount: accept routes without the 'api' segment
// so requests to /RuouOngTu/customer/login still work.
app.use("/RuouOngTu/customer", customerAuthRoutes);
// Also mount under /RuouOngTu/auth so Google OAuth callback URL
// http://localhost:3000/RuouOngTu/auth/google/callback matches the route.
app.use("/RuouOngTu/auth", customerAuthRoutes);
// Mount auth-specific routes (refresh, logout)
app.use("/RuouOngTu/auth", authRoutes);
// Server listen
// NOTE: CORS and cookieParser already configured above. No duplicate middleware here.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy ở cổng ${PORT}`);
  console.log(`📘 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(
    ` Hãy truy cập link sau để test API http://localhost:3000/ruouOngTu`
  );
});
