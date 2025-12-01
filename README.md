# BackEnd — API Reference & Overview

This README lists the backend API endpoints, environment variables, and a short summary of implemented features for the `BackEnd` service in this project.

Base mount: all APIs are mounted under `/RuouOngTu` (see `server.js`).

Quick start

- Install dependencies: `npm install`
- Run dev server (project uses your usual script): `npm run dev`

Environment variables (important)

- `PORT` — default 3000
- `FRONTEND_ORIGIN` — origin of the frontend app (used for CORS and postMessage target)
- `USER_EMAIL` — SMTP sender email (Gmail address when using Gmail App Password)
- `NODE_MAILER_KEY` — SMTP password or Gmail App Password
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` — Google OAuth
- `REFRESH_TOKEN_EXPIRES_DAYS` — refresh token lifetime (days)

Email/OTP behavior

- OTP entries are stored in the `EmailOTP` table (Sequelize model: `src/models/email_otp.model.js`).
- OTP types used: `register` (default) and `forgot_password` (reset flow). The `otp_type` column is an ENUM and must match these values.
- Emails are sent via Nodemailer SMTP configured with `USER_EMAIL` and `NODE_MAILER_KEY` (Gmail SMTP by default).

Authentication & Session

- Access tokens: short-lived JWTs returned in JSON.
- Refresh tokens: long-lived tokens stored as HttpOnly cookie `refreshToken`; server stores hashed refresh tokens in DB table `refresh_tokens`.
- `onLoginSuccess` helper issues access & refresh tokens and writes login logs (`src/services/login.service.js`).

Key controllers & services

- Controllers (HTTP handlers): `src/controllers/*`

  - `customer_auth.controller.js` — login (email/password), Google OAuth callback
  - `registration_controller.js` — registration OTP flows (check-email, verify-otp, resend)
  - `forgot_password.controller.js` — forgot-password: check-email, verify-otp, reset-password
  - `refreshtoken_controller.js` — refresh access token using refresh cookie
  - `logout_controller.js` — revoke refresh token + clear cookie
  - `profile_controller.js` — get profile (requires access token)
  - `product_controller.js` — product CRUD handlers
  - `region_controller.js` — regions and region-specific product handlers

- Services (business logic): `src/services/*`
  - `email_otp.service.js` — OTP generation, hashing, send (Nodemailer), verify, finalize registration, resend, reset-password helpers
  - `login.service.js` — token generation, refresh token storage, login logs
  - `user.service.js`, `product.service.js`, `region.service.js` — domain services

API Endpoints (summary)

Products (mounted at `/RuouOngTu/products`)

- GET `/RuouOngTu/products` — list all products
- GET `/RuouOngTu/products/:id` — get product detail
- POST `/RuouOngTu/products` — create product
- PUT `/RuouOngTu/products/:id` — update product
- DELETE `/RuouOngTu/products/:id` — delete product

Regions (mounted at `/RuouOngTu/regions`)

- GET `/RuouOngTu/regions` — list regions
- GET `/RuouOngTu/regions/:regionId` — region detail
- GET `/RuouOngTu/regions/:regionId/products` — products in region
- GET `/RuouOngTu/regions/:regionId/products/:productId` — product in region

Customer Authentication & Profile (mounted at `/RuouOngTu/customer` and `/RuouOngTu/api/customer` and `/RuouOngTu/auth`)

- POST `/RuouOngTu/customer/login` — login with email/password
  - Body: `{ email, password }` — returns `{ accessToken, user, ... }` and sets `refreshToken` cookie
- GET `/RuouOngTu/customer/profile` — get profile (requires `Authorization: Bearer <accessToken>`)
- GET `/RuouOngTu/customer/google` — start Google OAuth (redirect to Google)
- GET `/RuouOngTu/customer/google/callback` — Google OAuth callback (returns HTML that posts message to opener)

Auth routes (mounted at `/RuouOngTu/auth`)

- POST `/RuouOngTu/auth/refresh` — rotate refresh token, set new refresh cookie, return new access token
- POST `/RuouOngTu/auth/logout` — revoke refresh token and clear cookie

Registration / OTP (mounted at `/RuouOngTu/auth`)

- POST `/RuouOngTu/auth/check-email` — (registration) check if email free and send OTP
  - Body: `{ email }`
- POST `/RuouOngTu/auth/verify-otp` — verify OTP and finalize registration
  - Body: `{ email, otp, username?, password?, phone? }` — creates user and account, returns login tokens
- POST `/RuouOngTu/auth/resend-otp` — resend registration OTP
  - Body: `{ email }`

Forgot-password / Reset (new endpoints under `/RuouOngTu/auth`)

- POST `/RuouOngTu/auth/forgot-password/check-email` — verify email exists and send OTP of type `forgot_password`
  - Body: `{ email }`
- POST `/RuouOngTu/auth/forgot-password/verify-otp` — verify OTP (type `forgot_password`)
  - Body: `{ email, otp }`
- POST `/RuouOngTu/auth/reset-password` — set new password for account
  - Body: `{ email, new_password }` — hashes password and updates `customers_account.password_hash`, removes reset OTP

Database models (high level)

- `customers` (`src/models/user.model.js`) — user profile
- `customers_account` (`src/models/customers_account.model.js`) — login accounts (password_hash, login_type, email)
- `EmailOTP` (`src/models/email_otp.model.js`) — otp_hash, otp_type (ENUM), expired_at, attempt_count, etc.
- `refresh_tokens` (`src/models/refresh_token.model.js`) — stored hashed refresh tokens, session_id
- `login_logs` (`src/models/loginlog.model.js`) — audit of logins & logout

Notes & troubleshooting

- If you see MySQL "Data truncated for column 'otp_type'" errors, ensure OTP creation uses one of the ENUM values (`register`, `forgot_password`, `change_email`, `2fa`).
- SMTP must be configured (set `USER_EMAIL` and `NODE_MAILER_KEY`) to send emails. Check logs prefixed with `[EmailOTP]` for send attempts and errors.
- Google OAuth callback uses `FRONTEND_ORIGIN` to postMessage results to the frontend popup. Make sure `FRONTEND_ORIGIN` is correct.

Further improvements (ideas)

- Add rate-limits on forgot-password endpoints to prevent abuse
- Add structured API docs (Swagger already present; keep updating annotations)
- Add integration tests for OTP flows

If you want, I can also generate a machine-readable JSON (OpenAPI) summary of endpoints or add a short curl examples section — tell me which you prefer.

---

Generated by tooling to summarize the current `BackEnd` codebase.
