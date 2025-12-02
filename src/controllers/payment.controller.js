import * as momoService from "../services/momo.service.js";

function collectOrderCodes(body = {}) {
  if (body.order_codes) {
    return body.order_codes;
  }

  if (body.orderCode && !body.orderCodes?.length) {
    return body.orderCode;
  }

  if (body.orderCodes && body.orderCodes.length) {
    return body.orderCodes;
  }

  return [];
}

export const createMomoPayment = async (req, res) => {
  try {
    const orderCodesInput = collectOrderCodes(req.body);
    const userId = req.user?.user_id || req.user?.userId;

    if (!orderCodesInput || (Array.isArray(orderCodesInput) && !orderCodesInput.length)) {
      return res.status(400).json({
        error: "INVALID_INPUT",
        message: "order_codes là bắt buộc",
      });
    }

    if (!userId) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Vui lòng đăng nhập" });
    }

    const payload = await momoService.createMoMoPayment(orderCodesInput, userId);

    return res.status(200).json({
      success: true,
      message: "MoMo payment URL created",
      data: payload,
    });
  } catch (error) {
    console.error("[MOMO] create payment error:", error);

    const statusCode =
      error.code === "INVALID_ORDER"
        ? 403
        : error.code === "INVALID_STATUS" || error.code === "INVALID_AMOUNT"
        ? 400
        : error.code === "MOMO_ERROR"
        ? 502
        : 500;

    return res.status(statusCode).json({
      error: error.code || "SERVER_ERROR",
      message: error.message || "Không thể tạo giao dịch MoMo",
      details: error.details,
    });
  }
};

export const handleMomoIpn = async (req, res) => {
  try {
    const result = await momoService.handleMomoIpn(req.body || {});

    if (!result.isValid) {
      return res.status(400).json({
        error: "INVALID_SIGNATURE",
        message: "MoMo signature verification failed.",
      });
    }

    if (!result.isSuccess) {
      return res.status(200).json({
        message: "IPN received",
        status: "FAILED",
        data: result.momoPayload,
      });
    }

    return res.status(200).json({
      message: "IPN received",
      status: "SUCCESS",
      orders: result.orderCodes,
    });
  } catch (error) {
    console.error("[MOMO] IPN error:", error);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Unexpected IPN error" });
  }
};
