import * as userService from "../services/user.service.js";

// Controller group for customer-related endpoints (profile, history, invoices...)
export const getProfile = async (req, res) => {
  try {
    // `authenticateToken` middleware puts token payload into req.user
    const payload = req.user;
    if (!payload || !payload.user_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await userService.getUserById(payload.user_id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Return only the public fields required by frontend
    const result = {
      username: user.username,
      email: user.email,
      phone_number: user.phone_number || null,
      address: user.address || null,
    };

    return res.json({ success: true, user: result });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Placeholder for future customer controllers (e.g., order history, invoices)
export const getOrderHistory = async (req, res) => {
  return res.status(501).json({ success: false, message: "Not implemented" });
};

export default {
  getProfile,
  getOrderHistory,
};
