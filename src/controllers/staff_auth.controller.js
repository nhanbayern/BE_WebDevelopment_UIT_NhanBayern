import * as staffAuthService from "../services/staff_auth.service.js";

/**
 * Staff Authentication Controller
 * Handles staff login/logout requests
 */

/**
 * POST /staff/auth/login
 * Staff login with login_name and password
 */
export async function loginStaff(req, res) {
  try {
    const { login_name, password } = req.body;

    if (!login_name || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tên đăng nhập và mật khẩu",
      });
    }

    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const result = await staffAuthService.loginStaff(
      login_name,
      password,
      ip,
      userAgent
    );

    if (!result.success) {
      return res.status(401).json(result);
    }

    // Set refresh token as HttpOnly cookie (30 days)
    // Always use secure=true and sameSite=none for HTTPS API
    const cookieOptions = {
      httpOnly: true,
      secure: true, // Required for HTTPS and SameSite=none
      sameSite: "none", // Allow cross-origin cookies (localhost to HTTPS API)
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/", // Ensure cookie is available for all paths
    };
    
    res.cookie("staffRefreshToken", result.refreshToken, cookieOptions);
    
    console.log("[STAFF LOGIN] Cookie set:", {
      cookieOptions,
      hasRefreshToken: !!result.refreshToken,
      tokenLength: result.refreshToken?.length,
      requestOrigin: req.headers.origin
    });

    // Don't send refreshToken in response body
    const { refreshToken, ...responseData } = result;

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("[StaffAuthController] Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng nhập",
    });
  }
}

/**
 * GET /staff/auth/profile
 * Get current staff profile (requires authentication)
 */
export async function getStaffProfile(req, res) {
  try {
    const staff_id = req.staff.staff_id;

    const staff = await staffAuthService.getStaffById(staff_id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      staff: staff.toJSON(),
    });
  } catch (error) {
    console.error("[StaffAuthController] Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin profile",
    });
  }
}

/**
 * POST /staff/auth/change-password
 * Change staff password
 */
export async function changePassword(req, res) {
  try {
    const staff_id = req.staff.staff_id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp mật khẩu cũ và mật khẩu mới",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
    }

    const result = await staffAuthService.updateStaffPassword(
      staff_id,
      oldPassword,
      newPassword
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffAuthController] Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi đổi mật khẩu",
    });
  }
}

/**
 * POST /staff/auth/create
 * Create new staff account (admin only - for now any authenticated staff)
 */
export async function createStaffAccount(req, res) {
  try {
    const { login_name, password, staff_name, email, phone_number, position } =
      req.body;

    if (!login_name || !password || !staff_name) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin bắt buộc",
      });
    }

    const result = await staffAuthService.createStaff({
      login_name,
      password,
      staff_name,
      email,
      phone_number,
      position,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("[StaffAuthController] Create staff error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo tài khoản staff",
    });
  }
}

/**
 * PUT /staff/auth/profile
 * Update current staff profile (requires authentication)
 * Supports multipart/form-data for profile image upload
 */
export async function updateStaffProfile(req, res) {
  try {
    const staff_id = req.staff.staff_id;
    const { staff_name, email, phone_number } = req.body;
    const profileImgFile = req.file || null; // From multer middleware

    console.log("🔵 updateStaffProfile called");
    console.log("   - staff_id:", staff_id);
    console.log("   - Has file:", !!profileImgFile);
    console.log("   - Body:", JSON.stringify(req.body));

    const updateData = {};
    if (staff_name !== undefined) updateData.staff_name = staff_name;
    if (email !== undefined) updateData.email = email;
    if (phone_number !== undefined) updateData.phone_number = phone_number;

    if (Object.keys(updateData).length === 0 && !profileImgFile) {
      return res.status(400).json({
        success: false,
        message: "Không có dữ liệu để cập nhật",
      });
    }

    const result = await staffAuthService.updateStaffProfile(
      staff_id,
      updateData,
      profileImgFile
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffAuthController] Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thông tin",
    });
  }
}

/**
 * POST /staff/auth/refresh
 * Refresh staff access token using refresh token from cookie
 */
export async function refreshStaffToken(req, res) {
  try {
    const refreshToken = req.cookies.staffRefreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token không tồn tại",
      });
    }

    const result = await staffAuthService.refreshStaffAccessToken(refreshToken);

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[StaffAuthController] Refresh token error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi làm mới token",
    });
  }
}
