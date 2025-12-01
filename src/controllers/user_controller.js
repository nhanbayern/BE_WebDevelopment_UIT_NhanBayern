import pool from "../config/mysqlPool.js";
import { validationResult } from "express-validator";

// Helper to validate phone number (basic) - allows + and digits, 9-15 digits
const PHONE_RE = /^\+?\d{9,15}$/;

export async function updateProfileController(req, res) {
  try {
    // req.user set by authenticateToken middleware
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Validate express-validator results (if used in route)
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { username, phone_number, address } = req.body || {};

    // Build dynamic update only for provided fields (and allowed ones)
    const fields = [];
    const params = [];
    if (typeof username === "string" && username.trim() !== "") {
      if (username.length > 100)
        return res.status(400).json({ message: "username too long" });
      fields.push("username = ?");
      params.push(username.trim());
    }
    if (typeof phone_number === "string") {
      const phone = phone_number.trim();
      if (!PHONE_RE.test(phone))
        return res.status(400).json({ message: "Invalid phone format" });
      fields.push("phone_number = ?");
      params.push(phone);
    }
    if (typeof address === "string") {
      const a = address.trim();
      if (a.length > 255)
        return res.status(400).json({ message: "address too long" });
      fields.push("address = ?");
      params.push(a);
    }

    if (fields.length === 0)
      return res.status(400).json({ message: "No updatable fields provided" });

    params.push(userId);

    const sql = `UPDATE customers SET ${fields.join(", ")} WHERE user_id = ?`;
    const [result] = await pool.execute(sql, params);

    // Return updated user
    const [rows] = await pool.execute(
      "SELECT user_id, username, email, phone_number, address, google_id, created_at FROM customers WHERE user_id = ?",
      [userId]
    );
    if (!rows || rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAddressController(req, res) {
  const conn = await pool.getConnection();
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const addressId = parseInt(req.params.address_id, 10);
    if (Number.isNaN(addressId))
      return res.status(400).json({ message: "Invalid address_id" });

    const { address_line, ward, district, province, is_default } =
      req.body || {};

    // Ensure address exists and belongs to user
    const [addrRows] = await conn.execute(
      "SELECT * FROM user_address WHERE address_id = ?",
      [addressId]
    );
    if (!addrRows || addrRows.length === 0)
      return res.status(404).json({ message: "Address not found" });
    const addr = addrRows[0];
    if (String(addr.user_id) !== String(userId))
      return res.status(403).json({ message: "Forbidden" });

    // Validate inputs
    const updates = [];
    const params = [];
    if (typeof address_line === "string") {
      const v = address_line.trim();
      if (v.length === 0)
        return res
          .status(400)
          .json({ message: "address_line cannot be empty" });
      if (v.length > 255)
        return res.status(400).json({ message: "address_line too long" });
      updates.push("address_line = ?");
      params.push(v);
    }
    if (typeof ward === "string") {
      const v = ward.trim();
      if (v.length > 50)
        return res.status(400).json({ message: "ward too long" });
      updates.push("ward = ?");
      params.push(v);
    }
    if (typeof district === "string") {
      const v = district.trim();
      if (v.length > 50)
        return res.status(400).json({ message: "district too long" });
      updates.push("district = ?");
      params.push(v);
    }
    if (typeof province === "string") {
      const v = province.trim();
      if (v.length > 50)
        return res.status(400).json({ message: "province too long" });
      updates.push("province = ?");
      params.push(v);
    }
    let wantDefault = null;
    if (typeof is_default !== "undefined") {
      const val = Number(is_default);
      if (![0, 1].includes(val))
        return res.status(400).json({ message: "is_default must be 0 or 1" });
      wantDefault = val;
      updates.push("is_default = ?");
      params.push(val);
    }

    if (updates.length === 0)
      return res.status(400).json({ message: "No editable fields provided" });

    await conn.beginTransaction();

    if (wantDefault === 1) {
      // Set all user's addresses to 0
      await conn.execute(
        "UPDATE user_address SET is_default = 0 WHERE user_id = ?",
        [userId]
      );
    }

    params.push(addressId);
    const sql = `UPDATE user_address SET ${updates.join(
      ", "
    )} WHERE address_id = ?`;
    const [updateResult] = await conn.execute(sql, params);

    await conn.commit();

    // Return updated address
    const [newRows] = await pool.execute(
      "SELECT * FROM user_address WHERE address_id = ?",
      [addressId]
    );
    return res.json(newRows[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    conn.release();
  }
}

export async function createAddressController(req, res) {
  const conn = await pool.getConnection();
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { address_line, ward, district, province, is_default } =
      req.body || {};

    if (typeof address_line !== "string" || address_line.trim().length === 0)
      return res.status(400).json({ message: "address_line is required" });
    const aLine = address_line.trim();
    if (aLine.length > 255)
      return res.status(400).json({ message: "address_line too long" });

    const w = typeof ward === "string" ? ward.trim() : null;
    const d = typeof district === "string" ? district.trim() : null;
    const p = typeof province === "string" ? province.trim() : null;
    const def = typeof is_default !== "undefined" ? Number(is_default) : 0;
    if (![0, 1].includes(def))
      return res.status(400).json({ message: "is_default must be 0 or 1" });

    await conn.beginTransaction();

    if (def === 1) {
      await conn.execute(
        "UPDATE user_address SET is_default = 0 WHERE user_id = ?",
        [userId]
      );
    }

    const [ins] = await conn.execute(
      "INSERT INTO user_address (user_id, address_line, ward, district, province, is_default) VALUES (?,?,?,?,?,?)",
      [userId, aLine, w, d, p, def]
    );

    const insertId = ins.insertId;

    // Generate per-user sequential number: count addresses for this user
    const [cntRows] = await conn.execute(
      "SELECT COUNT(*) AS cnt FROM user_address WHERE user_id = ?",
      [userId]
    );
    const number = cntRows[0] && cntRows[0].cnt ? Number(cntRows[0].cnt) : 1;
    const padded = String(number).padStart(3, "0");
    const address_code = `Address${userId}${padded}`;

    // Ensure column address_code exists; add it if missing (safe check)
    const [colRows] = await conn.execute(
      "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_address' AND COLUMN_NAME = 'address_code'"
    );
    if (!colRows[0] || Number(colRows[0].cnt) === 0) {
      await conn.execute(
        "ALTER TABLE user_address ADD COLUMN address_code VARCHAR(64) NULL UNIQUE"
      );
    }

    await conn.execute(
      "UPDATE user_address SET address_code = ? WHERE address_id = ?",
      [address_code, insertId]
    );

    await conn.commit();

    const [newRows] = await pool.execute(
      "SELECT * FROM user_address WHERE address_id = ?",
      [insertId]
    );
    return res.status(201).json(newRows[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    conn.release();
  }
}

export async function deleteAddressController(req, res) {
  const conn = await pool.getConnection();
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const addressId = parseInt(req.params.address_id, 10);
    if (Number.isNaN(addressId))
      return res.status(400).json({ message: "Invalid address_id" });

    // Verify ownership
    const [addrRows] = await conn.execute(
      "SELECT * FROM user_address WHERE address_id = ?",
      [addressId]
    );
    if (!addrRows || addrRows.length === 0)
      return res.status(404).json({ message: "Address not found" });
    const addr = addrRows[0];
    if (String(addr.user_id) !== String(userId))
      return res.status(403).json({ message: "Forbidden" });

    await conn.beginTransaction();
    await conn.execute("DELETE FROM user_address WHERE address_id = ?", [
      addressId,
    ]);

    // If deleted address was default, optionally set another address as default (pick newest)
    if (addr.is_default === 1) {
      const [other] = await conn.execute(
        "SELECT address_id FROM user_address WHERE user_id = ? ORDER BY address_id DESC LIMIT 1",
        [userId]
      );
      if (other && other.length > 0) {
        await conn.execute(
          "UPDATE user_address SET is_default = 1 WHERE address_id = ?",
          [other[0].address_id]
        );
      }
    }

    await conn.commit();
    return res.json({ message: "Deleted" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    conn.release();
  }
}

export async function getAddressesController(req, res) {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const [rows] = await pool.execute(
      "SELECT * FROM user_address WHERE user_id = ? ORDER BY is_default DESC, address_id DESC",
      [userId]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
