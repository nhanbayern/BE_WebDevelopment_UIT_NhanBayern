import dotenv from "dotenv";
import express from "express";
import cors from "cors";

// ✅ Import routes
import productRoutes from "./src/routes/productRoutes.js";
import regionRoutes from "./src/routes/regionRoutes.js"; // 👈 mới thêm
import authRoutes from "./src/routes/authRoutes.js";
// ✅ Import swagger config
import setupSwagger from "./apidoc/swagger-apidoc.js";

dotenv.config();

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Swagger setup
setupSwagger(app);

// Routes setup
app.use("/RuouOngTu/products", productRoutes);
app.use("/RuouOngTu/regions", regionRoutes); // dòng này để bật route region/products
app.use("/RuouOngTu/auth", authRoutes);
// Server listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy ở cổng ${PORT}`);
  console.log(`📘 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(
    ` Hãy truy cập link sau để test API http://localhost:3000/ruouOngTu`
  );
});
