import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import Staff from "../models/staff.model.js";
import LoginLog from "../models/loginlog.model.js";
import { uploadImage, deleteImage } from "../config/cloudinary.js";

/**
 * Staff Authentication Service
 * Handles staff login/logout operations
 * Similar structure to customer_auth.service.js but for staff table
 */

/**
 * Login staff with login_name + password
 * @param {string} login_name - Staff login username
 * @param {string} password - Plain text password
 * @param {string} ip - IP address
 * @param {string} userAgent - User agent string
 * @returns {object} - Login result with token or error
 */
export async function loginStaff(login_name, password, ip, userAgent) {
  try {
    // Find staff by login_name
    const staff = await Staff.findOne({ where: { login_name } });

    if (!staff) {
      // Log failed login attempt
      await LoginLog.create({
        customer_id: null,
        staff_id: null,
        input_username: login_name,
        username: login_name,
        ip_address: ip,
        user_agent: userAgent,
        status: "failed",
        error_message: "Tài khoản staff không tồn tại",
      });

      return { success: false, message: "Tài khoản không tồn tại" };
    }

    // Check if staff is active
    if (staff.status !== "ACTIVE") {
      await LoginLog.create({
        customer_id: null,
        staff_id: staff.staff_id,
        input_username: login_name,
        username: staff.staff_name,
        ip_address: ip,
        user_agent: userAgent,
        status: "failed",
        error_message: "Tài khoản đã bị vô hiệu hóa",
      });

      return { success: false, message: "Tài khoản đã bị vô hiệu hóa" };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, staff.password_hash);

    if (!isPasswordValid) {
      await LoginLog.create({
        customer_id: null,
        staff_id: staff.staff_id,
        input_username: login_name,
        username: staff.staff_name,
        ip_address: ip,
        user_agent: userAgent,
        status: "failed",
        error_message: "Mật khẩu không đúng",
      });

      return { success: false, message: "Mật khẩu không đúng" };
    }

    // Generate access token
    const accessToken = generateStaffAccessToken(staff);

    // Log successful login
    await LoginLog.create({
      customer_id: null,
      staff_id: staff.staff_id,
      input_username: login_name,
      username: staff.staff_name,
      ip_address: ip,
      user_agent: userAgent,
      status: "success",
    });

    return {
      success: true,
      message: "Đăng nhập thành công",
      accessToken,
      staff: {
        staff_id: staff.staff_id,
        login_name: staff.login_name,
        staff_name: staff.staff_name,
        email: staff.email,
        phone_number: staff.phone_number,
        position: staff.position,
        status: staff.status,
      },
    };
  } catch (error) {
    console.error("[StaffAuthService] Login error:", error);
    return { success: false, message: "Lỗi server khi đăng nhập" };
  }
}

/**
 * Generate JWT access token for staff
 * @param {object} staff - Staff object
 * @returns {string} - JWT token
 */
function generateStaffAccessToken(staff) {
  const payload = {
    staff_id: staff.staff_id,
    login_name: staff.login_name,
    staff_name: staff.staff_name,
    position: staff.position,
    type: "staff", // Important: differentiate from customer tokens
  };

  const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET;
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRY || "1h";

  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Get staff profile by staff_id
 * @param {string} staff_id - Staff ID
 * @returns {object|null} - Staff profile or null
 */
export async function getStaffById(staff_id) {
  try {
    const staff = await Staff.findByPk(staff_id, {
      attributes: {
        exclude: ["password_hash"], // Don't return password hash
      },
    });

    return staff;
  } catch (error) {
    console.error("[StaffAuthService] Get staff by ID error:", error);
    return null;
  }
}

/**
 * Verify staff token
 * @param {string} token - JWT token
 * @returns {object} - Decoded token or null
 */
export function verifyStaffToken(token) {
  try {
    const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET;
    const decoded = jwt.verify(token, secret);

    // Ensure it's a staff token
    if (decoded.type !== "staff") {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("[StaffAuthService] Token verification error:", error);
    return null;
  }
}

/**
 * Create new staff account (admin only)
 * @param {object} staffData - Staff data
 * @returns {object} - Created staff or error
 */
export async function createStaff(staffData) {
  try {
    const { login_name, password, staff_name, email, phone_number, position } =
      staffData;

    // Check if login_name already exists
    const existing = await Staff.findOne({ where: { login_name } });
    if (existing) {
      return { success: false, message: "Tên đăng nhập đã tồn tại" };
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Generate staff_id
    const staff_id = `S${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;

    // Create staff
    const staff = await Staff.create({
      staff_id,
      login_name,
      password_hash,
      staff_name,
      email,
      phone_number,
      position,
      status: "ACTIVE",
    });

    return {
      success: true,
      message: "Tạo tài khoản staff thành công",
      staff: {
        staff_id: staff.staff_id,
        login_name: staff.login_name,
        staff_name: staff.staff_name,
        email: staff.email,
        position: staff.position,
      },
    };
  } catch (error) {
    console.error("[StaffAuthService] Create staff error:", error);
    return { success: false, message: "Lỗi khi tạo tài khoản staff" };
  }
}

/**
 * Update staff password
 * @param {string} staff_id - Staff ID
 * @param {string} oldPassword - Old password
 * @param {string} newPassword - New password
 * @returns {object} - Success or error
 */
export async function updateStaffPassword(staff_id, oldPassword, newPassword) {
  try {
    const staff = await Staff.findByPk(staff_id);

    if (!staff) {
      return { success: false, message: "Staff không tồn tại" };
    }

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, staff.password_hash);
    if (!isValid) {
      return { success: false, message: "Mật khẩu cũ không đúng" };
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 10);

    // Update password
    await staff.update({ password_hash });

    return { success: true, message: "Đổi mật khẩu thành công" };
  } catch (error) {
    console.error("[StaffAuthService] Update password error:", error);
    return { success: false, message: "Lỗi khi đổi mật khẩu" };
  }
}

/**
 * Update staff profile
 * @param {string} staff_id - Staff ID
 * @param {object} updateData - Data to update (staff_name, email, phone_number)
 * @param {object} profileImgFile - Uploaded file from multer (optional)
 * @returns {object} - Success or error with updated staff
 */
export async function updateStaffProfile(staff_id, updateData, profileImgFile = null) {
  try {
    const staff = await Staff.findByPk(staff_id);

    if (!staff) {
      return { success: false, message: "Staff không tồn tại" };
    }

    // Only allow updating specific fields
    const allowedFields = ["staff_name", "email", "phone_number"];
    const updateFields = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    }

    // Handle profile image upload if file is provided
    if (profileImgFile) {
      try {
        console.log("📤 Uploading profile image to Cloudinary...");
        
        // Upload to Cloudinary with custom public_id (staff_id)
        const uploadResult = await uploadImage(profileImgFile.path, {
          folder: "staff_profiles",
          public_id: staff_id, // Use staff_id as public_id
          overwrite: true, // Overwrite if exists
        });
        
        console.log("✅ Image uploaded:", uploadResult.secure_url);
        
        // Delete the temporary file
        fs.unlinkSync(profileImgFile.path);
        
        // Update profileimg field with Cloudinary URL
        updateFields.profileimg = uploadResult.secure_url;
        
        // Delete old profile image from Cloudinary if it exists and is different
        if (staff.profileimg && staff.profileimg !== uploadResult.secure_url) {
          try {
            console.log("🗑️ Deleting old profile image from Cloudinary...");
            await deleteImage(`staff_profiles/${staff_id}`);
          } catch (deleteError) {
            console.error("Failed to delete old profile image:", deleteError.message);
            // Continue anyway, not critical
          }
        }
      } catch (uploadError) {
        // Clean up temp file if upload fails
        if (profileImgFile && profileImgFile.path && fs.existsSync(profileImgFile.path)) {
          fs.unlinkSync(profileImgFile.path);
        }
        console.error("Upload error:", uploadError);
        return { 
          success: false, 
          message: "Lỗi khi upload ảnh: " + uploadError.message 
        };
      }
    }

    // Update staff profile
    await staff.update(updateFields);

    // Reload to get updated data
    await staff.reload();

    return {
      success: true,
      message: "Cập nhật thông tin thành công",
      staff: {
        staff_id: staff.staff_id,
        login_name: staff.login_name,
        staff_name: staff.staff_name,
        email: staff.email,
        phone_number: staff.phone_number,
        position: staff.position,
        profileimg: staff.profileimg,
        status: staff.status,
      },
    };
  } catch (error) {
    console.error("[StaffAuthService] Update profile error:", error);
    return { success: false, message: "Lỗi khi cập nhật thông tin" };
  }
}
