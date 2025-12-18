import dotenv from "dotenv";
import os from "os";
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
import shoppingCartRoutes from "./src/routes/shoppingCartRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import paymentRoutes from "./src/routes/payment.routes.js";import staffAuthRoutes from "./src/routes/staffAuthRoutes.js";
import staffManagementRoutes from "./src/routes/staffManagementRoutes.js";// Import associations to set up model relationships
import "./src/models/associations.js";
//  Import swagger config
import setupSwagger from "./apidoc/swagger-apidoc.js";
// Import token cleanup scheduler
import { startTokenCleanupScheduler } from "./src/utils/token_cleanup.js";
import {
  getCookieSecurityOptions,
  shouldTrustProxy,
} from "./src/utils/cookie_config.js";
// Import Cloudinary configuration
import { testConnection as testCloudinaryConnection } from "./src/config/cloudinary.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const isProd = process.env.NODE_ENV === "production";
const HOST = process.env.HOST || "0.0.0.0";

if (shouldTrustProxy()) {
  app.set("trust proxy", 1);
}

function normalizeOrigin(value) {
  if (!value) return null;
  return value.trim().replace(/\/$/, "");
}

function collectOrigins() {
  const originCandidates = [
    process.env.API_PUBLIC_URL,
    process.env.FRONTEND_ORIGIN,
    process.env.REMOTE_ORIGIN,
    process.env.PUBLIC_ORIGIN,
    process.env.CORS_EXTRA_ORIGINS,
    ensureProtocol(process.env.PUBLIC_DNS),
    ensureProtocol(process.env.PUBLIC_IP),
  ];

  const fallbackApiOrigin = resolveApiBaseOrigin();
  if (fallbackApiOrigin) {
    originCandidates.push(fallbackApiOrigin);
  }

  const parsed = originCandidates
    .filter(Boolean)
    .flatMap((item) => item.split(","))
    .map((item) => item.trim()) // Trim whitespace from each item
    .map(normalizeOrigin)
    .filter(Boolean);

  if (!isProd) {
    parsed.push("http://localhost:5174", "http://127.0.0.1:5174");
    // Also allow the staff management frontend port if set in environment
    if (process.env.STAFF_MANAGEMENT_PORT) {
      const port = process.env.STAFF_MANAGEMENT_PORT.trim();
      parsed.push(`http://localhost:${port}`, `http://127.0.0.1:${port}`);
    }
  }

  return Array.from(new Set(parsed));
}

const allowedOrigins = collectOrigins();

// Debug: Log loaded origins on startup
console.log('🔐 CORS Allowed Origins:', allowedOrigins);

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
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-ORIGIN"],
    exposedHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400, // 24 hours
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
// Increase payload size limits for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const { sameSite: cookieSameSite, secure: cookieSecure } =
  getCookieSecurityOptions();

app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: cookieSecure,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: cookieSameSite,
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
// Mount customer routes under the RuouOngTu base (includes profile, addresses, auth)
app.use("/RuouOngTu/customer", customerAuthRoutes);
// Mount auth-specific routes (refresh, logout)
app.use("/RuouOngTu/auth", authRoutes);

// Shopping cart routes (under /customer prefix)
app.use("/RuouOngTu/customer", shoppingCartRoutes);

// Order routes
app.use("/RuouOngTu/orders", orderRoutes);

// Payment routes (VNPay) align with /RuouOngTu namespace (no /api prefix)
app.use("/RuouOngTu/payment", paymentRoutes);

// Staff Authentication routes
app.use("/RuouOngTu/staff/auth", staffAuthRoutes);

// Staff Management routes (authenticated staff only)
app.use("/RuouOngTu/staff", staffManagementRoutes);

// Server listen
// NOTE: CORS and cookieParser already configured above. No duplicate middleware here.
const PORT = process.env.PORT || 3000;

function ensureProtocol(value, protocol = "https") {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `${protocol}://${value}`;
}

function resolveApiBaseOrigin() {
  const preferred = normalizeOrigin(process.env.API_PUBLIC_URL);
  if (preferred) return preferred;

  const dnsOrigin = normalizeOrigin(ensureProtocol(process.env.PUBLIC_DNS));
  if (dnsOrigin) return dnsOrigin;

  const ipOrigin = normalizeOrigin(ensureProtocol(process.env.PUBLIC_IP));
  if (ipOrigin) return ipOrigin;

  const localHost = HOST === "0.0.0.0" ? "localhost" : HOST;
  return `http://${localHost}:${PORT}`;
}

function logNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const addresses = Object.values(interfaces)
    .flat()
    .filter((iface) => iface && !iface.internal && iface.family === "IPv4")
    .map((iface) => iface.address);

  console.log("🌐 Network Interfaces:", addresses.join(", ") || "Unknown");
  if (process.env.PUBLIC_IP) {
    console.log(`🌍 PUBLIC_IP: ${process.env.PUBLIC_IP}`);
  }
  if (process.env.PUBLIC_DNS) {
    console.log(`🌍 PUBLIC_DNS: ${process.env.PUBLIC_DNS}`);
  }
}

app.listen(PORT, HOST, async () => {
  console.log(`✅ Server đang chạy ở cổng ${PORT} (host ${HOST})`);
  const apiOrigin = resolveApiBaseOrigin();
  console.log(`🛠️  Base API: ${apiOrigin}/RuouOngTu`);
  console.log(`📘 API Docs: ${apiOrigin}/api-docs`);
  logNetworkInfo();
  
  // Test Cloudinary connection
  console.log("\n🔌 Testing external services...");
  await testCloudinaryConnection();
  
  startTokenCleanupScheduler();
});
