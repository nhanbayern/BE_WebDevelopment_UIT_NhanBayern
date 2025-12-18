import { validationResult } from "express-validator";
import * as customerService from "../services/customer.service.js";

// ========== CUSTOMER PROFILE CONTROLLERS ==========

/**
 * Get customer profile
 * GET /customer/profile
 */
export const getProfile = async (req, res) => {
  try {
    const customerId = req.user?.user_id;
    if (!customerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const customer = await customerService.getCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Return public fields using new schema (customername, profileimage)
    // Provide backward compatibility aliases
    const result = {
      customer_id: customer.customer_id,
      customername: customer.customername,
      username: customer.customername, // Backward compatibility
      email: customer.email,
      phone_number: customer.phone_number || null,
      profileimage: customer.profileimage || null,
      google_id: customer.google_id || null,
      login_type: customer.login_type,
      created_at: customer.created_at,
    };

    return res.json({ success: true, user: result });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update customer profile
 * POST /customer/update
 * Supports both JSON and multipart/form-data (for avatar upload)
 */
export const updateProfile = async (req, res) => {
  try {
    console.log("🔵 updateProfile called");
    console.log("   - Has file:", !!req.file);
    console.log("   - Body:", JSON.stringify(req.body));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.user?.user_id;
    if (!customerId) {
      console.log("❌ No customerId in token");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { username, phone_number, address } = req.body || {};
    const avatarFile = req.file || null;

    console.log("   - customerId:", customerId);
    console.log("   - avatarFile:", avatarFile ? avatarFile.filename : "none");

    try {
      const updatedCustomer = await customerService.updateCustomerProfile(
        customerId,
        {
          username,
          phone_number,
          address,
        },
        avatarFile
      );

      console.log("✅ Profile updated successfully");
      return res.json(updatedCustomer);
    } catch (serviceError) {
      console.error("❌ Service error:", serviceError);
      return res.status(400).json({ message: serviceError.message });
    }
  } catch (error) {
    console.error("❌ Profile update error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ========== CUSTOMER ADDRESS CONTROLLERS ==========

/**
 * Get all addresses for current customer
 * GET /customer/addresses
 */
export const getAddresses = async (req, res) => {
  try {
    const customerId = req.user?.user_id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const addresses = await customerService.getCustomerAddresses(customerId);
    return res.json(addresses);
  } catch (error) {
    console.error("Get addresses error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Create new address for current customer
 * POST /customer/addresses
 */
export const createAddress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.user?.user_id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { address_line, ward, district, province, is_default } = req.body || {};

    const newAddress = await customerService.createCustomerAddress(customerId, {
      address_line,
      ward,
      district,
      province,
      is_default,
    });

    return res.status(201).json(newAddress);
  } catch (error) {
    console.error("Create address error:", error);
    return res.status(400).json({ message: error.message });
  }
};

/**
 * Update existing address
 * PUT /customer/addresses/:address_id
 */
export const updateAddress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.user?.user_id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const addressId = parseInt(req.params.address_id, 10);
    if (Number.isNaN(addressId)) {
      return res.status(400).json({ message: "Invalid address_id" });
    }

    const { address_line, ward, district, province, is_default } = req.body || {};

    const updatedAddress = await customerService.updateCustomerAddressById(
      addressId,
      customerId,
      {
        address_line,
        ward,
        district,
        province,
        is_default,
      }
    );

    return res.json(updatedAddress);
  } catch (error) {
    console.error("Update address error:", error);
    if (error.message.includes("not found") || error.message.includes("access denied")) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(400).json({ message: error.message });
  }
};

/**
 * Delete address
 * DELETE /customer/addresses/:address_id
 */
export const deleteAddress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.user?.user_id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const addressId = parseInt(req.params.address_id, 10);
    if (Number.isNaN(addressId)) {
      return res.status(400).json({ message: "Invalid address_id" });
    }

    const result = await customerService.deleteCustomerAddress(addressId, customerId);
    return res.json(result);
  } catch (error) {
    console.error("Delete address error:", error);
    if (error.message.includes("not found") || error.message.includes("access denied")) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(400).json({ message: error.message });
  }
};

/**
 * Get customer order history
 * GET /customer/orders
 */
export const getOrderHistory = async (req, res) => {
  return res.status(501).json({ success: false, message: "Not implemented" });
};

export default {
  getProfile,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getOrderHistory,
};
