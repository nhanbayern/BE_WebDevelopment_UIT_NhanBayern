import { Sequelize } from "sequelize";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/* ==========================
 * Load ENV
 * ========================== */
const DB_HOST = process.env.CLOUD_DB_HOST;
const DB_PORT = process.env.CLOUD_DB_PORT;
const DB_USER = process.env.CLOUD_DB_USER;
const DB_PASSWORD = process.env.CLOUD_DB_PASSWORD;
const DB_NAME = process.env.CLOUD_DB_NAME;

/* ==========================
 * DEBUG ENV LOG
 * ========================== */
console.log("=====================================");
console.log("🔧 DATABASE CONFIG LOADED:");
console.log(`🌐 HOST: ${DB_HOST}`);
console.log(`🔌 PORT: ${DB_PORT}`);
console.log(`👤 USER: ${DB_USER}`);
console.log(`📁 DB NAME: ${DB_NAME}`);
console.log("=====================================\n");

/* ==========================
 * Sequelize INIT
 * ========================== */
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  logging: (msg) => console.log(`📄 SQL: ${msg}`),
  timezone: "+07:00",
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

/* ==========================
 * Test Connection + LOG ERROR DETAILS
 * ========================== */
try {
  await sequelize.authenticate();
  console.log("=====================================");
  console.log("✅ KẾT NỐI MYSQL THÀNH CÔNG");
  console.log(`🔗 MySQL: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
  console.log("=====================================\n");
} catch (error) {
  console.log("\n=====================================");
  console.error("❌ LỖI KẾT NỐI MYSQL QUA SEQUELIZE");

  console.error("📌 Error message:", error.message);
  console.error("📌 Error name:", error.name);
  console.error("📌 Error code:", error.original?.code);
  console.error("📌 SQL State:", error.original?.sqlState);
  console.error("📌 SQL Errorno:", error.original?.errno);
  console.error("📌 Full error object:", error);

  console.log("=====================================\n");
}

export default sequelize;
