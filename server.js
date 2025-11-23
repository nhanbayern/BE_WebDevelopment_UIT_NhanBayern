import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// passport configuration
import passport from "./src/config/passport.js";
import productRoutes from "./src/routes/productRoutes.js";
// Đảm bảo chỉ import customerAuthRoutes, xoá các dòng liên quan đến authRoutes nếu có
import customerAuthRoutes from "./src/routes/customerAuthRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
//  Import swagger config
import setupSwagger from "./apidoc/swagger-apidoc.js";
// Import token cleanup scheduler
import { startTokenCleanupScheduler } from "./src/utils/token_cleanup.js";

dotenv.config();

const app = express();
// If running behind a reverse proxy in production, enable trust proxy so
// secure cookies and req.ip behave correctly.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
// Middleware setup
// CORS: cho phép cookie (credentials) từ frontend origin cấu hình
// Trim trailing slash if user set FRONTEND_ORIGIN with a slash (causes CORS mismatch)
const FRONTEND_ORIGIN = (
  process.env.FRONTEND_ORIGIN || "http://localhost:3000"
).replace(/\/$/, "");

// Allow the configured origin, and also common dev origins (Vite default 5174).
// Use a function to echo the incoming origin when it matches allowed patterns
// This is helpful in dev when the browser origin may be http://localhost:5174
// and requests are proxied by Vite to the backend.
const allowedDevOrigins = ["http://localhost:5174", "http://localhost:3000"];
app.use(
  cors({
    origin: function (origin, callback) {
      // If no origin (e.g. curl / same-origin server-side) allow it
      if (!origin) return callback(null, true);
      if (origin === FRONTEND_ORIGIN || allowedDevOrigins.includes(origin)) {
        return callback(null, true);
      }
      // unknown origin: deny
      return callback(new Error("Not allowed by CORS"), false);
    },
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

// Debug endpoint to check cookies (dev only)
if (process.env.NODE_ENV !== "production") {
  app.get("/debug/cookies", (req, res) => {
    res.json({
      cookies: req.cookies,
      headers: {
        cookie: req.headers.cookie,
        origin: req.headers.origin,
        userAgent: req.headers["user-agent"],
      },
    });
  });
}

// Routes setup
app.use("/RuouOngTu/products", productRoutes);
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
// User profile & address management
app.use("/RuouOngTu/api/user", userRoutes);
// Backwards-compatible mount so callers using /RuouOngTu/user/* still work
app.use("/RuouOngTu/user", userRoutes);
// Server listen
// NOTE: CORS and cookieParser already configured above. No duplicate middleware here.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy ở cổng ${PORT}`);
  console.log(`📘 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(
    ` Hãy truy cập link sau để test API http://localhost:3000/ruouOngTu`
  );

  // Start token cleanup scheduler
  startTokenCleanupScheduler();
});
