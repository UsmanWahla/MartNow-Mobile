# Existing MartNow backend integration

This is a customer-only Expo client. The supplied MartNow backend remains the only source of truth; the mobile repository contains no backend, database, server secrets, mock products, or fake orders.

## Inspected backend

- Supplied archive path: `MartNow-main/backend`
- Entry point: `backend/server.js`
- Runtime: Node.js `http.createServer`
- Default port: `5000`
- Database: MySQL through the existing `mysql2` pool
- Required server configuration remains in the web/backend project

## Authentication and session

Customer authentication uses:

- `POST /api/customer/signup`
- `POST /api/customer/login`
- `POST /api/refresh`
- `POST /api/logout`

Login and signup return `{ message, token, user }`. The app stores the access token in Expo SecureStore. Requests send `Authorization: Bearer <token>` and credentials. A `401` triggers one refresh attempt, saves the rotated access token, retries the original request, and clears the local customer session if refresh fails.

The refresh token is HTTP-only and cookie-based. Its persistence must be part of physical-device release testing because native cookie behavior belongs to the platform networking layer.

## Customer API contract

Public marketplace:

- `GET /`
- `GET /api/stores/public` → `{ rows }`
- `GET /api/shop/:slug` → store metadata directly
- `GET /api/shop/:slug/products?q=&page=&limit=&all=1` → `{ shop_name, shop_slug, rows, total }`
- `GET /api/shop/:slug/products/:productId` → `{ shop_name, shop_slug, product }`

Customer account:

- `GET | PUT /api/customer/profile`
- `PUT /api/customer/profile/password` with `{ currentPassword, newPassword }`
- `GET | POST /api/customer/addresses`
- `PUT | DELETE /api/customer/addresses/:addressId`
- `PUT /api/customer/addresses/:addressId/default`
- `GET /api/customer/orders?status=&page=&limit=` → `{ rows, total }`
- `GET /api/customer/orders/:orderId` → order directly

Store cart and checkout:

- `GET /api/shop/:slug/cart` → cart directly
- `POST /api/shop/:slug/cart` with `product_id`, `quantity`, and optional `color`/`size`
- `PUT | DELETE /api/shop/:slug/cart/:itemId`
- `GET /api/shop/:slug/checkout/profile` → checkout profile directly
- `POST /api/shop/:slug/checkout` → created order directly

Location helpers:

- `GET /api/locations/search?q=`
- `GET /api/locations/reverse?latitude=&longitude=`

## Product and marketplace behavior

Marketplace search filters stores, matching the web customer frontend. Product search, derived category filters, featured products, and sorting live inside a selected store. `all=1` is required to load the complete store catalogue; `all=true` is not accepted by this backend.

Product quantities honor `quantity_step`, `sale_unit`, and `units_per_sale_unit`. Required color/size variants are validated before cart insertion. A cart belongs to the store whose add-to-cart operation succeeded; browsing another store does not silently reassign it.

The current backend exposes no wishlist, reviews, coupons, or push-notification API, so the mobile app does not create fake implementations.

## Assets and errors

Uploaded store/product images are served from `/uploads/...`. API service errors use `{ message }`; the client converts those into native loading, empty, retry, toast, or confirmation states.
