# Ruou Ông Tư Backend

> Node.js + Express API for the Ruou Ông Tư e-commerce platform. All public traffic flows through HTTPS (`https://api.ruouongtu.me`) and every route is mounted under `/RuouOngTu` behind NGINX.

---

## Contents

1. [Architecture & Stack](#architecture--stack)
2. [Local Development](#local-development)
3. [Environment Variables](#environment-variables)
4. [Running & Deployment](#running--deployment)
5. [API Surface](#api-surface)
6. [Authentication Flow](#authentication-flow)
7. [Payment Workflows](#payment-workflows)
8. [Swagger / API Docs](#swagger--api-docs)
9. [Troubleshooting](#troubleshooting)

---

## Architecture & Stack

- **Runtime**: Node.js 20+, Express 5, Sequelize ORM on MySQL 8.
- **Hosting**: AWS EC2 (Ubuntu) reverse-proxied by NGINX; Express trusts proxy headers to correctly emit Secure cookies.
- **Base Path**: All endpoints live under `/RuouOngTu`, simplifying rewrites and API gateway routing.
- **Auth**: JWT access tokens + HttpOnly refresh cookies; Google OAuth via `passport-google-oauth20`.
- **Mail & OTP**: Nodemailer (Gmail App Password). OTP entries live in `email_otp` with ENUM types `register`, `forgot_password`, etc.
- **Payments**: VNPay + MoMo Sandbox with retry-safe orderIds and 120s timeout watchdog.
- **Docs**: Swagger UI available at `/api-docs` (public URL `https://api.ruouongtu.me/api-docs`).

Directory overview:

```
backend/
├── server.js                 # Express bootstrap & middleware wiring
├── apidoc/                   # Swagger config & helpers
├── src/
│   ├── config/               # DB, passport setup
│   ├── controllers/          # HTTP handlers
│   ├── middleware/           # auth, logging, error handling
│   ├── models/               # Sequelize models
│   ├── routes/               # Modular routers (products, auth, payment, ...)
│   ├── services/             # Business logic (OTP, orders, MoMo, ...)
│   └── utils/                # token cleanup, helpers
└── uploads/                  # Static assets served via /uploads
```

## Local Development

```bash
git clone <repo>
cd backend
npm install

# Create environment file (copy from production template if available)
cp .env.example .env   # create the template if missing

# Start MySQL locally (matching .env credentials)

# Boot the API
npm start               # or NODE_ENV=development node server.js
```

Tips:
- `NODE_ENV=development` enables verbose logs and auto-whitelists `http://localhost:5174` (Vite default) for CORS.
- Use ngrok/localtunnel if you need MoMo/VNPay IPNs to reach your workstation.
- Sequelize expects an existing schema. Reference SQL under `src/dbfile/` when provisioning databases.

## Environment Variables

| Name | Purpose |
| --- | --- |
| `PORT`, `HOST` | Express bind info (defaults `3000`, `0.0.0.0`). |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `CLOUD_DB_*` | Local and cloud MySQL credentials. |
| `JWT_SECRET`, `ACCESS_TOKEN_EXPIRES`, `REFRESH_TOKEN_EXPIRES_DAYS` | Token generation settings. |
| `FRONTEND_ORIGIN`, `REMOTE_ORIGIN`, `CORS_EXTRA_ORIGINS` | Allowed origins (production = `https://ruou-ong-tu.vercel.app`). |
| `PUBLIC_API_BASE_URL`, `SWAGGER_URL`, `API_PUBLIC_URL` | Public URLs served via NGINX (`https://api.ruouongtu.me/RuouOngTu`). |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Google OAuth configuration. |
| `USER_EMAIL`, `NODE_MAILER_KEY` | SMTP sender + app password. |
| `VNP_TMNCODE`, `VNP_HASHSECRET`, `VNP_URL`, `VNP_RETURNURL`, `VNP_IPNURL` | VNPay sandbox setup. |
| `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_API_URL` | MoMo sandbox credentials. |
| `MOMO_REDIRECT_URL`, `MOMO_IPN_URL`, `MOMO_SESSION_TIMEOUT_MS` | Redirect/IPN endpoints + timeout (default `120000`). |
| `PUBLIC_IP`, `PUBLIC_DNS` | Optional metadata shown in boot logs. |

> Store production secrets in AWS Systems Manager / Secrets Manager. Never commit `.env`.

## Running & Deployment

### Development
- `npm start` launches Express with your current `.env`.
- Swagger UI: `http://localhost:3000/api-docs`.
- Static uploads: `http://localhost:3000/uploads/*`.

### Production
- Managed by PM2 or systemd. Example: `pm2 start server.js --name ruou-ong-tu-api --env production`.
- NGINX terminates TLS and proxies `https://api.ruouongtu.me` → `http://127.0.0.1:3000`.
- Set `NODE_ENV=production` (or `TRUST_PROXY=true`) so Express marks cookies as `Secure` + `SameSite=None`.
- `server.js` logs public IP/DNS and doc URLs for quick verification after deploy.

## API Surface

| Module | Mount | Notes |
| --- | --- | --- |
| **Products** | `/RuouOngTu/products` | CRUD, filters, pagination. |
| **Orders** | `/RuouOngTu/orders` | Create, list, detail, update status/payment. |
| **Shopping Cart** | `/RuouOngTu/user` | Add/remove items, view cart. |
| **Customer Auth** | `/RuouOngTu/customer`, `/RuouOngTu/auth` | Email login, Google OAuth, OTP registration, forgot password. |
| **User/Profile** | `/RuouOngTu/user` | Profile, addresses, logout, refresh token. |
| **Payments** | `/RuouOngTu/payment` | VNPay + MoMo endpoints (`/momo/create`, `/momo/ipn`, `/vnpay/*`). |

Responses follow a consistent JSON shape (`{ success, data, message }` / `{ error, message }`). See `src/routes/*.js` for details and Swagger annotations.

## Authentication Flow

1. **Login** – `POST /RuouOngTu/customer/login` returns `{ accessToken, user }` and sets `refreshToken` HttpOnly cookie.
2. **Protected APIs** – include `Authorization: Bearer <accessToken>`.
3. **Refresh** – `POST /RuouOngTu/auth/refresh` rotates tokens when the access token expires.
4. **Logout** – `POST /RuouOngTu/auth/logout` revokes the refresh token and clears the cookie.
5. **Google OAuth** – `GET /RuouOngTu/auth/google` + callback at `https://api.ruouongtu.me/RuouOngTu/auth/google/callback`, which posts a message back to `FRONTEND_ORIGIN`.
6. **OTP flows** – registration + forgot password use `email_otp` with hashed OTPs, TTL, and attempt counters handled by `email_otp.service.js`.

## Payment Workflows

### VNPay
- Creates signed redirect URLs using `VNP_*` envs.
- VNPay IPN (`/RuouOngTu/payment/vnpay/ipn`) updates `orders.payment_status` to `Paid/Unpaid`.

### MoMo Sandbox
- **Create session** (`POST /RuouOngTu/payment/momo/create`)
  - Accepts one or many `order_code`s owned by the caller, requiring `OnlineBanking` + `Unpaid`.
  - Aggregates `final_amount`, generates retry-safe `orderId` (timestamp + retry index), calls MoMo `payWithMethod` API.
  - Persists a pending-session record and starts a 120-second timeout. If MoMo never responds, orders revert to `Unpaid`.
- **IPN callback** (`POST /RuouOngTu/payment/momo/ipn`)
  - Verifies HMAC signature using `MOMO_SECRET_KEY`.
  - `resultCode === 0`: mark orders `Paid`, store `transId`, cancel timer.
  - Otherwise: mark `Unpaid`, log failure reason, allow retries.
  - Always responds `{ resultCode: 0, message: "IPN received" }` so MoMo stops retrying.
- **Timeout Handling**
  - When 120 seconds elapse without IPN, backend marks session `TIMEOUT`, resets orders to `Unpaid`, and frees the retry lock.

Frontend polling example:
```ts
const res = await fetch(`${import.meta.env.VITE_API_URL}/RuouOngTu/orders/${orderId}`, {
  headers: { Authorization: `Bearer ${token}` }
});
const paymentStatus = (await res.json()).order.payment_status; // Paid | Unpaid
```

Find the complete sequence diagram and JSON samples in `apidoc.md`.

## Swagger / API Docs

- Definition lives in `apidoc/swagger-apidoc.js` and aggregates JSDoc annotations from `src/routes/*.js`.
- Local UI: `http://localhost:3000/api-docs`
- Production UI: `https://api.ruouongtu.me/api-docs`
- Add/adjust annotations whenever you create new routes to keep docs synchronized.

## Troubleshooting

- **CORS blocked** – ensure `FRONTEND_ORIGIN` & `REMOTE_ORIGIN` match your actual frontend URL (no trailing slashes).
- **Secure cookies missing** – set `NODE_ENV=production` or `TRUST_PROXY=true` so Express knows it's behind NGINX.
- **MoMo IPN not hitting server** – confirm `MOMO_IPN_URL` is public and that NGINX allows POST `/RuouOngTu/payment/momo/ipn`.
- **OTP ENUM errors** – only use allowed types (`register`, `forgot_password`, `change_email`, `two_factor`).
- **Uploads 403** – check filesystem permissions and update the NGINX location block for `/uploads`.
- **Database drift** – re-run SQL in `src/dbfile/` or add Sequelize migrations before deploying schema changes.

---

Maintained by the Ruou Ông Tư backend team. For infra changes or credentials, contact @nhanbayern.
