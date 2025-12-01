import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
// passport configuration
import passport from "./src/config/passport.js";
import productRoutes from "./src/routes/productRoutes.js";
// Đảm bảo chỉ import customerAuthRoutes, xoá các dòng liên quan đến authRoutes nếu có
import customerAuthRoutes from "./src/routes/customerAuthRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import shoppingCartRoutes from "./src/routes/shoppingCartRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
// Import associations to set up model relationships
import "./src/models/associations.js";
//  Import swagger config
import setupSwagger from "./apidoc/swagger-apidoc.js";
// Import token cleanup scheduler
import { startTokenCleanupScheduler } from "./src/utils/token_cleanup.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
// If running behind a reverse proxy in production, enable trust proxy so
// secure cookies and req.ip behave correctly.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
// Middleware setup
// CORS: cho phép cookie (credentials) từ frontend origin cấu hình
// Trim trailing slash if user set FRONTEND_ORIGIN with a slash (causes CORS mismatch)
const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || "").replace(/\/$/, "");
const REMOTE_ORIGIN = (process.env.REMOTE_ORIGIN || "").replace(/\/$/, "");
const allowedOrigins = [FRONTEND_ORIGIN, REMOTE_ORIGIN].filter(Boolean);

// Allow the configured origin, and also common dev origins (Vite default 5174).
// Use a function to echo the incoming origin when it matches allowed patterns
// This is helpful in dev when the browser origin may be http://localhost:5174
// and requests are proxied by Vite to the backend.

app.use(
  //cors
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  })
);

// Debug middleware: log incoming origin and configured allowed origin
app.use((req, res, next) => {
  const origin = req.headers.origin || "-";
  console.log(
    `[CORS DEBUG] ${req.method} ${
      req.url
    } - request origin: ${origin} | allowed origins: ${allowedOrigins.join(
      ", "
    )}`
  );

  next();
});
// parse cookies (để đọc HttpOnly refresh token)
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express session middleware (required for Passport)
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
    },
  })
);

app.use("/uploads", express.static("uploads"));
app.use(passport.initialize());
app.use(passport.session());
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
// Mount customer routes under the RuouOngTu base
app.use("/RuouOngTu/customer", customerAuthRoutes);
// Mount auth-specific routes (refresh, logout)
app.use("/RuouOngTu/auth", authRoutes);
// User profile & address management
app.use("/RuouOngTu/user", userRoutes);

// Shopping cart routes (under /user prefix)
app.use("/RuouOngTu/user", shoppingCartRoutes);

// Order routes
app.use("/RuouOngTu/orders", orderRoutes);

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
