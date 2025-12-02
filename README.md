# Rượu Ông Tư Backend

Node.js + Express API running behind NGINX (HTTPS-only) with every endpoint mounted under `/RuouOngTu`. This document highlights the processing logic by connecting routes, controllers, services, and models.

## Tech Stack

- **Runtime**: Node.js 20+, Express 5, Nodemon for local dev and PM2 for live server
- **Database**: MySQL 8 managed via Sequelize ORM and pooled connections
- **Auth**: JWT access tokens, HttpOnly refresh cookies, Passport Google OAuth2, custom OTP via Nodemailer
- **Payments**: MoMo `payWithMethod` 
- **Docs & Tooling**: Swagger (apidoc), ESLint/Prettier (implicit), PM2/systemd for production process management
- **Infra**: AWS EC2 Ubuntu + NGINX reverse proxy serving `https://api.ruouongtu.me`

## Source Layout Snapshot

```
src/
├── config/              # Database pool, Sequelize, Passport
├── controllers/         # HTTP layer per domain
├── middleware/          # Shared Express middlewares
├── models/              # Sequelize schemas and associations
├── routes/              # Route registrations grouped by domain
├── services/            # Business logic; each mirrors a controller
└── utils/               # Helpers (JWT, captcha, cookie, token cleanup)
uploads/                 # Product-related assets used by APIs
apidoc/                  # Swagger/OpenAPI docs
```

## Logic-Oriented Tree

Each entry shows the end-to-end flow Route → Controller → Service → Model(s).

### 1. Authentication & Session
```
Routes:      src/routes/customerAuthRoutes.js, src/routes/authRoutes.js
Controllers: src/controllers/customer_auth.controller.js, src/controllers/customer_controller.js,
             src/controllers/logout_controller.js, src/controllers/refreshtoken_controller.js
Services:    src/services/customer_auth.service.js, src/services/login.service.js,
             src/services/user.service.js
Models:      src/models/customers_account.model.js, src/models/loginlog.model.js,
             src/models/refresh_token.model.js, src/models/user.model.js
```
Handles login/registration OTP flows, logout, and refresh-token lifecycle.

### 2. Registration & Profile
```
Routes:      src/routes/userRoutes.js
Controllers: src/controllers/registration_controller.js, src/controllers/profile_controller.js,
             src/controllers/user_controller.js, src/controllers/user_profile.controller.js
Services:    src/services/user.service.js
Models:      src/models/user.model.js, src/models/user_address.model.js
```
Manages onboarding, profile edits, and address book state.

### 3. OTP & Email Verification
```
Routes:      (mounted inside auth/customerAuth routes)
Controllers: src/controllers/forgot_password.controller.js, src/controllers/debug_controller.js
Services:    src/services/email_otp.service.js
Models:      src/models/email_otp.model.js
```
Issues and validates OTP tokens for password recovery and troubleshooting hooks.

### 4. Product Catalog
```
Routes:      src/routes/productRoutes.js
Controllers: src/controllers/product_controller.js
Services:    src/services/product.service.js
Models:      src/models/product.model.js
```
Provides catalog CRUD, filtering, and media metadata.

### 5. Shopping Cart
```
Routes:      src/routes/shoppingCartRoutes.js
Controllers: src/controllers/shopping_cart.controller.js
Services:    src/services/shopping_cart.service.js
Models:      src/models/shopping_cart_item.model.js
```
Handles cart CRUD, quantity adjustments, and pricing totals.

### 6. Orders
```
Routes:      src/routes/orderRoutes.js
Controllers: src/controllers/order.controller.js
Services:    src/services/order.service.js
Models:      src/models/order.model.js, src/models/order_detail.model.js,
             src/models/user_address.model.js
```
Creates orders, maps shipment details, and stores order line items.

### 7. Payments (MoMo & VNPay)
```
Routes:      src/routes/payment.routes.js
Controllers: src/controllers/payment.controller.js
Services:    src/services/momo.service.js, src/services/order.service.js
Models:      src/models/order.model.js, src/models/order_detail.model.js
```
Starts payment sessions, processes provider callbacks, and reconciles order/payment status.

## Utilities & Middleware Links
- `src/middleware/auth_middleware.js`: JWT/refresh guard for protected routes.
- `src/utils/jwt.util.js`, `src/utils/cookie_config.js`, `src/utils/captcha.util.js`: shared helpers consumed across controllers.
- `src/utils/token_cleanup.js`: clears stale refresh tokens on a schedule.

## Environment Essentials
- `.env` stores DB credentials, JWT secrets, OAuth keys, and payment configs (never commit it).
- `src/config/db.js` + `src/config/mysqlPool.js` bootstrap Sequelize and pools from those values.
- Payment callbacks (MoMo/VNPay) must reach the HTTPS domain configured in NGINX.

## Runbook
1. `npm install`
2. Populate `.env` based on staging/production template.
3. `npm run dev` for local nodemon / `npm start` for production entry (`server.js`).
4. Swagger UI lives at `/api-docs`; definitions come from `apidoc/swagger-apidoc.js`.
 add Sequelize migrations before deploying schema changes.


