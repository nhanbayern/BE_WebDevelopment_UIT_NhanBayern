import crypto from "crypto";
import Order from "../models/order.model.js";

const MOMO_ENDPOINT =
  process.env.MOMO_API_URL || "https://test-payment.momo.vn/v2/gateway/api/create";
const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || "MOMO";
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
const MOMO_SECRET_KEY =
  process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
const MOMO_REDIRECT_URL =
  process.env.MOMO_REDIRECT_URL || "https://webhook.site/your-id";
const MOMO_IPN_URL = process.env.MOMO_IPN_URL || "https://webhook.site/your-id";
const MOMO_PARTNER_NAME = process.env.MOMO_PARTNER_NAME || "RuouOngTu";
const MOMO_STORE_ID = process.env.MOMO_STORE_ID || "RuouStore";
const MOMO_SESSION_TIMEOUT_MS = Number(process.env.MOMO_SESSION_TIMEOUT_MS || 120_000);

const activeSessions = new Map(); // orderId -> session
const orderSessionIndex = new Map(); // order_code -> orderId
const retryIndexCache = new Map(); // sorted order codes key -> retry count

function composeOrderKey(orderCodes = []) {
  return [...orderCodes].sort().join("|");
}

function nextRetryIndex(orderCodes = []) {
  const key = composeOrderKey(orderCodes);
  const nextIndex = (retryIndexCache.get(key) || 0) + 1;
  retryIndexCache.set(key, nextIndex);
  return nextIndex;
}

function ensureNoPendingSession(orderCodes = []) {
  const conflictCode = orderCodes.find((code) => orderSessionIndex.has(code));
  if (conflictCode) {
    const error = new Error(
      `Order ${conflictCode} already has a pending MoMo payment session. Please wait or retry later.`
    );
    error.code = "PENDING_PAYMENT";
    throw error;
  }
}

function cleanupSession(orderId, finalState = "UNKNOWN") {
  const session = activeSessions.get(orderId);
  if (!session) {
    return;
  }

  if (session.timer) {
    clearTimeout(session.timer);
  }

  session.orderCodes.forEach((code) => orderSessionIndex.delete(code));
  activeSessions.delete(orderId);
  session.finalState = finalState;
}

async function handleSessionTimeout(orderId) {
  const session = activeSessions.get(orderId);
  if (!session) {
    return;
  }

  await markOrdersUnpaid(session.orderCodes);
  cleanupSession(orderId, "TIMEOUT");
}

function registerPendingSession({ orderId, orderCodes, amount, requestId, userId, retryIndex }) {
  const timeoutAt = Date.now() + MOMO_SESSION_TIMEOUT_MS;
  const timer = setTimeout(() => {
    handleSessionTimeout(orderId).catch((err) =>
      console.error("[MOMO] Failed to handle timeout for", orderId, err)
    );
  }, MOMO_SESSION_TIMEOUT_MS);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  activeSessions.set(orderId, {
    orderId,
    orderCodes,
    amount,
    requestId,
    retryIndex,
    userId,
    createdAt: Date.now(),
    timeoutAt,
    timer,
    status: "PENDING",
  });

  orderCodes.forEach((code) => orderSessionIndex.set(code, orderId));

  return { timeoutAt };
}

async function markOrdersPaid(orderCodes = []) {
  if (!orderCodes.length) return 0;
  return Order.update(
    { payment_status: "Paid", payment_method: "OnlineBanking" },
    { where: { order_code: orderCodes } }
  );
}

async function markOrdersUnpaid(orderCodes = []) {
  if (!orderCodes.length) return 0;
  return Order.update({ payment_status: "Unpaid" }, { where: { order_code: orderCodes } });
}

function ensureEnv(value, key) {
  if (!value) {
    throw new Error(`Missing ${key} configuration for MoMo integration`);
  }
  return value;
}

function normalizeOrderCodes(orderCodeOrList) {
  if (!orderCodeOrList) {
    return [];
  }

  const list = Array.isArray(orderCodeOrList)
    ? orderCodeOrList
    : [orderCodeOrList];

  return [
    ...new Set(
      list
        .map((code) => (typeof code === "string" ? code.trim() : String(code || "").trim()))
        .filter(Boolean)
    ),
  ];
}

function buildCreateSignature({
  accessKey,
  amount,
  extraData,
  ipnUrl,
  orderId,
  orderInfo,
  partnerCode,
  redirectUrl,
  requestId,
  secretKey,
}) {
  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=payWithMethod`;

  return crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
}

function buildIpnSignature(payload = {}, secretKey, accessKey) {
  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${payload.amount || ""}` +
    `&extraData=${payload.extraData || ""}` +
    `&message=${payload.message || ""}` +
    `&orderId=${payload.orderId || ""}` +
    `&orderInfo=${payload.orderInfo || ""}` +
    `&orderType=${payload.orderType || ""}` +
    `&partnerCode=${payload.partnerCode || ""}` +
    `&payType=${payload.payType || ""}` +
    `&requestId=${payload.requestId || ""}` +
    `&responseTime=${payload.responseTime || ""}` +
    `&resultCode=${payload.resultCode || ""}` +
    `&transId=${payload.transId || ""}`;

  return crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
}

export async function createMoMoPayment(orderCodeInput, userId) {
  const partnerCode = ensureEnv(MOMO_PARTNER_CODE, "MOMO_PARTNER_CODE");
  const accessKey = ensureEnv(MOMO_ACCESS_KEY, "MOMO_ACCESS_KEY");
  const secretKey = ensureEnv(MOMO_SECRET_KEY, "MOMO_SECRET_KEY");
  const redirectUrl = ensureEnv(MOMO_REDIRECT_URL, "MOMO_REDIRECT_URL");
  const ipnUrl = ensureEnv(MOMO_IPN_URL, "MOMO_IPN_URL");

  if (!userId) {
    throw new Error("Yêu cầu đăng nhập trước khi thanh toán");
  }

  const normalizedCodes = normalizeOrderCodes(orderCodeInput);
  if (!normalizedCodes.length) {
    throw new Error("order_codes là bắt buộc");
  }

  const orders = await Order.findAll({
    where: {
      order_code: normalizedCodes,
      customer_id: userId,
    },
    order: [["created_at", "ASC"]],
  });

  if (orders.length !== normalizedCodes.length) {
    const error = new Error("You are not allowed to pay for these orders.");
    error.code = "INVALID_ORDER";
    throw error;
  }

  const invalidStatus = orders.find(
    (order) =>
      order.payment_method !== "OnlineBanking" || order.payment_status !== "Unpaid"
  );

  if (invalidStatus) {
    const error = new Error("Only unpaid OnlineBanking orders can be paid via MoMo.");
    error.code = "INVALID_STATUS";
    throw error;
  }

  ensureNoPendingSession(orderCodes);

  const totalAmount = orders.reduce(
    (sum, order) => sum + Number(order.final_amount || order.total_amount || 0),
    0
  );
  const amount = Math.round(totalAmount);

  if (amount <= 0) {
    const error = new Error("Giá trị đơn hàng không hợp lệ");
    error.code = "INVALID_AMOUNT";
    throw error;
  }

  const orderCodes = orders.map((order) => order.order_code);
  const retryIndex = nextRetryIndex(orderCodes);
  const uniqueSuffix = `${Date.now()}`;
  const orderId = `${orderCodes[0]}_${uniqueSuffix}_${retryIndex}`;
  const requestId = `${orderId}_${Math.floor(Math.random() * 10_000)}`;
  const orderInfo =
    orderCodes.length === 1
      ? `Online payment for order ${orderCodes[0]}`
      : `Online payment for ${orderCodes.length} orders`;
  const extraData = orderCodes.join(",");

  const signature = buildCreateSignature({
    accessKey,
    amount,
    extraData,
    ipnUrl,
    orderId,
    orderInfo,
    partnerCode,
    redirectUrl,
    requestId,
    secretKey,
  });

  const payload = {
    partnerCode,
    partnerName: MOMO_PARTNER_NAME,
    storeId: MOMO_STORE_ID,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    requestType: "payWithMethod",
    lang: "vi",
    autoCapture: true,
    extraData,
    signature,
  };

  const response = await fetch(MOMO_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const momoResponse = await response.json().catch(() => ({}));

  if (!response.ok || momoResponse.resultCode !== 0) {
    const message =
      momoResponse.message || momoResponse.localMessage || "MoMo gateway returned an error";
    const error = new Error(message);
    error.code = "MOMO_ERROR";
    error.details = momoResponse;
    throw error;
  }

  const sessionMeta = registerPendingSession({
    orderId,
    orderCodes,
    amount,
    requestId,
    userId,
    retryIndex,
  });

  return {
    paymentUrl: momoResponse.payUrl || momoResponse.deepLink || momoResponse.deeplink,
    orders: orderCodes,
    amount,
    orderCount: orderCodes.length,
    orderId,
    requestId,
    timeoutAt: sessionMeta.timeoutAt,
    retryIndex,
    momoResponse,
  };
}

export async function handleMomoIpn(payload = {}) {
  const accessKey = ensureEnv(MOMO_ACCESS_KEY, "MOMO_ACCESS_KEY");
  const secretKey = ensureEnv(MOMO_SECRET_KEY, "MOMO_SECRET_KEY");

  const expectedSignature = buildIpnSignature(payload, secretKey, accessKey);
  const isValid = payload.signature === expectedSignature;

  if (!isValid) {
    return { isValid: false };
  }

  const isSuccess = String(payload.resultCode) === "0";
  const rawCodes = (payload.extraData || "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);

  const session = activeSessions.get(payload.orderId);
  const orderCodes = rawCodes.length
    ? rawCodes
    : session?.orderCodes?.length
    ? session.orderCodes
    : payload.orderId
    ? [payload.orderId]
    : [];

  if (!orderCodes.length) {
    return {
      isValid: true,
      isSuccess,
      orderCodes: [],
      momoPayload: payload,
      finalStatus: isSuccess ? "PAID" : "UNPAID",
    };
  }

  if (isSuccess) {
    await markOrdersPaid(orderCodes);
    cleanupSession(payload.orderId, "PAID");
  } else {
    await markOrdersUnpaid(orderCodes);
    cleanupSession(payload.orderId, "FAILED");
  }

  return {
    isValid: true,
    isSuccess,
    orderCodes,
    momoPayload: payload,
    finalStatus: isSuccess ? "PAID" : "UNPAID",
  };
}
