import mysql from "mysql2/promise";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const DB_HOST = process.env.CLOUD_DB_HOST || process.env.DB_HOST || "127.0.0.1";
const DB_PORT =
  Number(process.env.CLOUD_DB_PORT || process.env.DB_PORT || 3306) || 3306;
const DB_USER = process.env.CLOUD_DB_USER || process.env.DB_USER || "root";
const DB_PASSWORD =
  process.env.CLOUD_DB_PASSWORD || process.env.DB_PASSWORD || "";
const DB_NAME = process.env.CLOUD_DB_NAME || process.env.DB_NAME || "backend";

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+07:00",
});

console.log(
  `[MySQL POOL] Connected pool config ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`
);

export default pool;
