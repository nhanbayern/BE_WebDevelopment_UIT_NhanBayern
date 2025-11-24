import { validationResult } from "express-validator";
import * as userService from "../services/user.service.js";

// ========== USER PROFILE CONTROLLERS ==========

/**
 * Get current user profile
 */
export const getProfileController = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userProfile = await userService.getUserProfile(userId);
      return res.json({ user: userProfile });
    } catch (serviceError) {
      if (serviceError.message.includes("not found")) {
        return res.status(404).json({ message: serviceError.message });
      }
      return res.status(400).json({ message: serviceError.message });
    }
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update current user profile
 */
export const updateProfileController = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { username, phone_number, address } = req.body || {};

    try {
      const updatedUser = await userService.updateUserProfile(userId, {
        username,
        phone_number,
        address,
      });

      return res.json(updatedUser);
    } catch (serviceError) {
      return res.status(400).json({ message: serviceError.message });
    }
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ========== USER ADDRESS CONTROLLERS ==========

/**
 * Get all addresses for current user
 */
export const getAddressesController = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const addresses = await userService.getUserAddresses(userId);
      return res.json(addresses);
    } catch (serviceError) {
      return res.status(400).json({ message: serviceError.message });
    }
  } catch (error) {
    console.error("Get addresses error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Create new address for current user
 */
export const createAddressController = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { address_line, ward, district, province, is_default } =
      req.body || {};

    try {
      const newAddress = await userService.createUserAddress(userId, {
        address_line,
        ward,
        district,
        province,
        is_default,
      });

      return res.status(201).json(newAddress);
    } catch (serviceError) {
      return res.status(400).json({ message: serviceError.message });
    }
  } catch (error) {
    console.error("Create address error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update existing address
 */
export const updateAddressController = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const addressId = parseInt(req.params.address_id, 10);
    if (Number.isNaN(addressId)) {
      return res.status(400).json({ message: "Invalid address_id" });
    }

    const { address_line, ward, district, province, is_default } =
      req.body || {};

    try {
      const updatedAddress = await userService.updateUserAddressById(
        addressId,
        userId,
        {
          address_line,
          ward,
          district,
          province,
          is_default,
        }
      );

      return res.json(updatedAddress);
    } catch (serviceError) {
      if (
        serviceError.message.includes("not found") ||
        serviceError.message.includes("access denied")
      ) {
        return res.status(404).json({ message: serviceError.message });
      }
      return res.status(400).json({ message: serviceError.message });
    }
  } catch (error) {
    console.error("Update address error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete address
 */
export const deleteAddressController = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const addressId = parseInt(req.params.address_id, 10);
    if (Number.isNaN(addressId)) {
      return res.status(400).json({ message: "Invalid address_id" });
    }

    try {
      const result = await userService.deleteUserAddress(addressId, userId);
      return res.json(result);
    } catch (serviceError) {
      if (
        serviceError.message.includes("not found") ||
        serviceError.message.includes("access denied")
      ) {
        return res.status(404).json({ message: serviceError.message });
      }
      return res.status(400).json({ message: serviceError.message });
    }
  } catch (error) {
    console.error("Delete address error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
