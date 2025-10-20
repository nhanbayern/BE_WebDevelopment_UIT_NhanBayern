// src/models/account.js
import db from "../config/db.js";

export const getAllAccounts = async () => {
  const [rows] = await db.execute(`
    SELECT ea.account_id, ea.employee_id, e.full_name, ea.username, ea.role, ea.is_locked, ea.last_login
    FROM employee_accounts ea
    JOIN employees e ON ea.employee_id = e.employee_id
    ORDER BY ea.account_id ASC
  `);
  return rows;
  // dòng select hơi đần, sẽ tạo view để sửa lại
};

export const getAccountById = async (id) => {
  const [rows] = await db.execute(
    `SELECT * FROM employee_accounts WHERE account_id = ?`,
    [id]
  );
  return rows[0]; // tìm tài khoản thông qua account
};

export const createAccount = async (
  employee_id,
  username,
  password_hash,
  role
) => {
  const [result] = await db.execute(
    `INSERT INTO employee_accounts (employee_id, username, password_hash, role)
     VALUES (?, ?, ?, ?)`,
    [employee_id, username, password_hash, role]
  );
  return result.insertId;
};

export const updateAccount = async (account_id, fields) => {
  const updates = Object.keys(fields)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = Object.values(fields);
  values.push(account_id);
  await db.execute(
    `UPD  ATE employee_accounts SET ${updates} WHERE account_id = ?`,
    values
  );
};

export const toggleLock = async (account_id, is_locked) => {
  await db.execute(
    `UPDATE employee_accounts SET is_locked = ? WHERE account_id = ?`,
    [is_locked, account_id]
  );
};
