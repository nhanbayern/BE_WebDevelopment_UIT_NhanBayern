import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.CLOUD_DB_HOST || "127.0.0.1",
  user: process.env.CLOUD_DB_USER || "root",
  password: process.env.CLOUD_DB_PASSWORD || "",
  database: process.env.CLOUD_DB_NAME || "test",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+07:00",
  debug: true,
});

export default pool;
