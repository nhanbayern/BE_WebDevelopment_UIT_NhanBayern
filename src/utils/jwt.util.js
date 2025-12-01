import jwt from "jsonwebtoken";

function getAccessSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured in the environment");
  }
  return secret;
}

function getRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || getAccessSecret();
}

export function generateAccessToken(payload) {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m",
  });
}

export function generateRefreshToken(payload) {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: `${process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30}d`,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getAccessSecret());
}
export function verifyRefreshToken(token) {
  return jwt.verify(token, getRefreshSecret());
}
