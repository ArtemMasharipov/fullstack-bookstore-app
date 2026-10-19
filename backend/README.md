# Bookstore Backend API

REST API of the bookstore: Node.js 24, Express 4, MongoDB (Mongoose), JWT.

Setup, configuration (`.env`), running, seed data and tests are described in the
[root README](../README.md). This file covers the backend itself.

## Scripts

Run them from `backend/`.

| Command            | What it does                                                              |
| ------------------ | ------------------------------------------------------------------------- |
| `npm start`        | `node server.js`                                                          |
| `npm run dev`      | the same under nodemon: restarts on source changes, not on `.env` edits (type `rs`, see the [root README](../README.md#run)) |
| `npm test`         | vitest with an in-memory MongoDB                                          |
| `npm run test:watch` | vitest in watch mode                                                    |
| `npm run seed`     | demo users, authors and books (`npm run seed -- --reset` to start over)   |
| `npm run e2e:server` | the API for the Playwright smoke test; started by Playwright, not by hand |

## Structure

```
backend/
├── app.js           # Express app: security headers, CORS, parsing, logging, routes, 404, error handler.
│                    # It neither listens nor connects to a database, so tests import it directly
├── server.js        # Entry point: loads .env, connects to MongoDB, listens, shuts down on SIGINT/SIGTERM
├── config/          # default.js (validated configuration), database.js, load-env.js, mongo-guard.js
├── routes/          # Route definitions and the access rules of each endpoint
├── controllers/     # HTTP handlers: read the request, call a service, send the response
├── services/        # Business logic; throws the errors of utils/errors.js; pricing.js computes cart quotes
├── models/          # Mongoose schemas
├── schemas/         # zod schemas of the request params, query and body that validate() checks
├── middleware/      # auth (protect, authorize), validate, errorHandler, requestLogger, asyncHandler
├── utils/           # Error classes and the success response helper
├── scripts/         # seed.js, seed-data.js, e2e-server.js
└── tests/           # unit and integration tests (vitest)
```

## API

Base path: `/api/v1`. The paths below are relative to it. Query parameters and request bodies are documented in the
comment above each route in [`routes/`](routes).

Access: **Public** needs no token; **User** needs a valid token of any role; **Admin** needs a token of a user whose
role is `admin`.

### Service

| Method | Path             | Access | Description                                                              |
| ------ | ---------------- | ------ | ------------------------------------------------------------------------ |
| GET    | `/health`        | Public | Health check                                                             |
| GET    | `/`              | Public | API info with the list of resource paths                                 |
| GET    | `/config/public` | Public | Shop settings: currency, VAT rate, shipping fee, free-shipping threshold |

`GET /` outside `/api/v1` also answers with a short info message.

### Auth (`/auth`)

| Method | Path             | Access | Description         |
| ------ | ---------------- | ------ | ------------------- |
| POST   | `/auth/register` | Public | Register a new user |
| POST   | `/auth/login`    | Public | Log in              |
| GET    | `/auth/me`       | User   | Current user        |
| PUT    | `/auth/password` | User   | Change password     |
| PUT    | `/auth/profile`  | User   | Update the profile  |
| POST   | `/auth/logout`   | User   | Log out (the client discards the token; nothing is revoked on the server) |

### Books (`/books`)

| Method | Path                      | Access | Description                  |
| ------ | ------------------------- | ------ | ---------------------------- |
| GET    | `/books`                  | Public | List books (filter, search, paginate) |
| GET    | `/books/category/:category` | Public | Books of a category        |
| GET    | `/books/author/:authorId` | Public | Books of an author           |
| GET    | `/books/:id`              | Public | One book                     |
| POST   | `/books`                  | Admin  | Create a book                |
| PUT    | `/books/:id`              | Admin  | Update a book                |
| PATCH  | `/books/:id/stock`        | Admin  | Change only the stock status |
| DELETE | `/books/:id`              | Admin  | Delete a book                |

`GET /books` takes `page` (from 1), `limit` (1–100, default 20), `category`, `authorId`, `inStock` (`true` or
`false`), `search` and `sortBy` (`-createdAt` by default, also `createdAt`, `title`, `price`, `publicationYear` and
their `-` forms). Any other parameter, or a value sent twice or as an object, answers 400. The category matches as a
whole value, case included (`Fiction` does not find `Science Fiction`); the search matches part of the title or the
description as plain text. Equal sort values are ordered by id, so pages never overlap. The answer is
`{ success, data, pagination: { page, limit, total, pages } }`.

Every book read answers the same book view: `id`, `title`, `author` (`{ id, firstName, lastName }`, with `bio` on
`GET /books/:id`; `null` if the author no longer exists), `publicationYear`, `category`, `description`, `price` (CZK,
in crowns), `image`, `inStock`, `createdAt` and `updatedAt`. `/books/category/:category` lists books in stock of
exactly that category.

Book writes use that same view: POST answers 201, PUT and stock PATCH answer 200, without a message or Mongoose
fields; DELETE answers 204 with no body. POST and PUT take a strict body: `title` (trimmed, 2–100), `authorId`,
`publicationYear` (JSON integer, 1450 through the current year), `category` (1–50), `price` (0–999999.99, at most two
decimals), optional `description` (up to 1000) and `image`, and `inStock` (boolean, defaults to true).
The cover is an `https://` URL up to 2048 characters or a PNG/JPEG/WebP/SVG data URI up to 200000 characters.
PUT replaces the book, removing omitted description/image and resetting omitted inStock to true. The stock PATCH
takes only `{ inStock: boolean }`. An unknown author answers 400 `VALIDATION_FAILED` with `authorId: "not_found"`;
a duplicate title/author/year answers 409 `CONFLICT` with `title: "duplicate"`. Unknown fields and wrong types
answer 400 with field codes.

### Authors (`/authors`)

| Method | Path                         | Access | Description                  |
| ------ | ---------------------------- | ------ | ---------------------------- |
| GET    | `/authors`                   | Public | List authors (filter, search, paginate) |
| GET    | `/authors/country/:country`  | Public | Authors of a country         |
| GET    | `/authors/:id`               | Public | One author                   |
| GET    | `/authors/:id/books`         | Public | Books of an author           |
| GET    | `/authors/:id/stats`         | Public | Statistics of an author      |
| POST   | `/authors`                   | Admin  | Create an author             |
| PUT    | `/authors/:id`               | Admin  | Update an author             |
| DELETE | `/authors/:id`               | Admin  | Delete an author             |

Every author view contains `id` (string), `firstName`, `lastName`, `bio` (empty string when absent), optional
`birthYear`, `country`, `website`, optional `booksCount`, and `createdAt`/`updatedAt`. It never contains `_id`, `__v`
or a stored `books` array. List and detail counts derive from `Book.author`; a list page uses one batch aggregation.

- `GET /authors`: page from 1, limit 1–100 (default 20), optional country and search, sortBy (default `-createdAt`).
  Sort keys are `createdAt`, `firstName`, `lastName`, `birthYear` and their `-` forms; id breaks ties in the same
  direction. Search matches literal text inside either name without case sensitivity, including a surname prefix,
  and combines with the exact country filter. The response is `{ success, data: AuthorView[], pagination }`, where
  pagination is exactly `{ page, limit, total, pages }`.
- `GET /authors/country/:country`: exact country, case included; limit 1–100 (default 50), same sort keys (default
  `lastName`). The response is `{ success, data: AuthorView[] }`, without count or pagination.
- `GET /authors/:id`: `{ success, data: AuthorView }`. The only query is `includeBooks=true|false` (default false).
  With true, data is `{ author: AuthorView, books: BookView[] }`: all books by this author, ordered by publication
  year descending, with id breaking ties. This explicit container replaces the old populated array inside an author.
- `GET /authors/:id/books`: `{ success, data: BookView[] }`, no count. Limit 1–100 (default 50), the book sort keys
  (default `-publicationYear`), optional `inStock=true|false`. A book carries the same view as the book endpoints.
- `GET /authors/:id/stats`: `{ success, data: { author: AuthorView, statistics } }`. Statistics contains numeric
  totalBooks, booksInStock and booksOutOfStock; categories is an array of strings. publicationYears
  `{ earliest, latest }` contains numbers or null, and pricing `{ lowest, highest, average }` contains numeric
  extrema or null and a two-decimal average string or null. Prices are CZK. This endpoint accepts no query parameters.

All params and query values are validated. A malformed id, unknown query, repeated value, bracket object or invalid
sort/boolean/limit answers 400 `VALIDATION_FAILED` with fields; a well-formed missing id answers 404 `NOT_FOUND`.

POST/PUT require firstName and lastName (trimmed, 2–50). Optional fields: bio (trimmed, up to 2000), birthYear
(JSON integer, 1000 through the year at validation time), country (trimmed, up to 100), website (trimmed HTTP/HTTPS
URL, up to 2048). Unknown fields and wrong types answer 400; writes accept no query parameters. POST answers 201,
PUT 200, both `{ success, data: AuthorView }`. PUT fully replaces the author: omitted optional fields are unset,
and any ignored legacy books array is removed on that successful write. An exact duplicate firstName/lastName after
trimming answers 409 `CONFLICT` with `fields: { lastName: "duplicate" }`; an author may keep its own name.

DELETE answers 204 with no body when the author has no books. Otherwise it answers 409 `AUTHOR_HAS_BOOKS`,
`details: { books: number }`, leaving both the author and books intact. The old `deleteBooks` query parameter is
removed and answers 400; no author endpoint deletes books implicitly.

### Cart (`/cart`, every route except `/cart/quote` needs a token)

| Method | Path            | Access | Description                                                                   |
| ------ | --------------- | ------ | ----------------------------------------------------------------------------- |
| GET    | `/cart`         | User   | The user's cart                                                               |
| POST   | `/cart`         | User   | Add copies of a book (`{ bookId, quantity = 1 }`)                             |
| PUT    | `/cart/:bookId` | User   | Set the quantity of a line (`{ quantity }`)                                   |
| DELETE | `/cart/:bookId` | User   | Remove a line                                                                 |
| DELETE | `/cart`         | User   | Empty the cart                                                                |
| POST   | `/cart/quote`   | Public | Price a guest cart (`{ items: [{ bookId, quantity }] }`); stores nothing      |
| POST   | `/cart/merge`   | User   | Add a guest cart to the user's cart after sign-in; answers `{ cart, report }` |

A cart stores book ids and quantities only. Every answer is `{ items, quote }`, built from the books as they are now:
each line has the title, author, image, `unitPrice` and `lineTotal`, and `available: false` with an
`unavailableReason` (`DELETED`, `OUT_OF_STOCK`) when the book can no longer be bought. The quote holds `itemsTotal`,
`shipping`, `vatAmount` (included, never added on top), `total` and `freeShippingThreshold`. Amounts are whole
geller (1/100 CZK). A quantity is a JSON integer from 1 to 99 per book; `quote` and `merge` take at most 50 lines.

### Orders (`/orders`, every route needs a token)

| Method | Path                  | Access | Description                                                                  |
| ------ | --------------------- | ------ | ---------------------------------------------------------------------------- |
| POST   | `/orders`             | User   | Place an order from the cart (`Idempotency-Key` header, see below)           |
| GET    | `/orders`             | User   | The user's orders, newest first (`page = 1`, `limit = 10`, at most 50)       |
| GET    | `/orders/:id`         | User   | One of the user's orders; another user's order is `NOT_FOUND`               |
| PATCH  | `/orders/:id/cancel`  | User   | Cancel a `pending` order that is `unpaid` or `failed`                        |
| GET    | `/orders/admin/all`   | Admin  | All orders with their `customer` (`page`, `limit = 20`, `status`, `paymentStatus`) |
| GET    | `/orders/admin/stats` | Admin  | Order counts and `totalRevenue` of paid orders, in geller                    |
| PATCH  | `/orders/:id/status`  | Admin  | Set the status (`{ status }`); a cancelled order keeps its status            |
| PATCH  | `/orders/:id/pay`     | Admin  | Record the payment; a `pending` order moves on to `processing`               |

`POST /orders` takes the address and the total the customer saw, in geller:

```json
{
  "shippingAddress": {
    "fullName": "Jan Novák", "line1": "Vodičkova 12", "city": "Praha",
    "postalCode": "110 00", "country": "CZ", "phone": "+420 777 123 456"
  },
  "expectedTotal": 29800
}
```

The server orders the cart as it is now and answers in this order:

| Status | Code                         | When                                                                  |
| ------ | ---------------------------- | --------------------------------------------------------------------- |
| 400    | `VALIDATION_FAILED`          | the body or the `Idempotency-Key` header is invalid (`fields`)        |
| 422    | `CART_EMPTY`                 | the cart is empty                                                     |
| 422    | `CART_HAS_UNAVAILABLE_ITEMS` | a book can no longer be bought (`details.items: [{ bookId, reason }]`) |
| 409    | `PRICE_CHANGED`              | `expectedTotal` is not the current total (`details.quote`)            |
| 201    |                              | the order is placed; its lines leave the cart                         |

The `Idempotency-Key` header is a UUID the client creates per checkout. The same key with the same body answers
200 with the order it placed, also after the cart was emptied; the same key with another body is
`IDEMPOTENCY_CONFLICT` (409). Only a placed order takes the key: after `PRICE_CHANGED` or a 422 the same key can be
sent again. A unique index on the user and the key settles two requests arriving at the same moment.

An order is `{ id, orderNumber, status, paymentStatus, items: [{ bookId, title, unitPrice, quantity, lineTotal }],
shippingAddress, quote, statusHistory: [{ axis, from, to, by, at }], createdAt }`. The number is
`ORD-YYYYMMDD-NNNNNN` from a counter per UTC day; gaps are possible. A new order is `pending` and `unpaid`: there is
no online payment yet. A status change that is not allowed is `INVALID_TRANSITION` (409).

Orders stored by the previous version (amounts as floats in crowns, the street in `address`, `isPaid`) are read in
the same shape without changing the stored document: amounts are converted to geller, their quote says
`vatIncluded: false` because their tax was added on top, and `isPaid` becomes `paymentStatus`.

### Users (`/users`, every route needs an admin token)

| Method | Path                    | Access | Description                  |
| ------ | ----------------------- | ------ | ---------------------------- |
| GET    | `/users`                | Admin  | List users (filter, search)  |
| GET    | `/users/stats`          | Admin  | User statistics              |
| GET    | `/users/role/:role`     | Admin  | Users with a role            |
| GET    | `/users/:id`            | Admin  | One user                     |
| POST   | `/users`                | Admin  | Create a user                |
| PUT    | `/users/:id`            | Admin  | Update a user                |
| PATCH  | `/users/:id/status`     | Admin  | Set the active status (`{ isActive: boolean }`) |
| DELETE | `/users/:id`            | Admin  | Delete a user (soft delete)  |
| DELETE | `/users/:id/permanent`  | Admin  | Delete a user permanently    |

## Authentication

`POST /auth/register` and `POST /auth/login` answer with the user and a JWT:

```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "username": "...", "email": "...", "role": "user", "...": "..." },
    "token": "eyJhbGciOi..."
  },
  "message": "Login successful"
}
```

Send the token with every protected request:

```
Authorization: Bearer <token>
```

The token is signed with `JWT_SECRET` and expires after `JWT_EXPIRATION` (default `7d`). Roles are `user` (the
default), `admin` and `moderator`; the routes check for `admin` only.

## Response format

Success: `{ "success": true, "data": ..., "message": "..." }` (`data` and `message` are not on every response).

Error, from every endpoint:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_FAILED", "message": "Validation failed", "fields": { "quantity": "too_big" } }
}
```

- `code` is stable and meant for the client, which translates it: `VALIDATION_FAILED` 400, `UNAUTHORIZED` 401,
  `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `INTERNAL` 500, and per endpoint `BOOK_UNAVAILABLE` 409,
  `CART_ITEM_NOT_FOUND` 404, `CART_EMPTY` 422, `CART_HAS_UNAVAILABLE_ITEMS` 422, `PRICE_CHANGED` 409,
  `IDEMPOTENCY_CONFLICT` 409 and `INVALID_TRANSITION` 409.
- `message` is English for developers; the client does not show it.
- `fields` maps each invalid request field to the rule it broke; `details` carries the payload of some codes.

Requests with params, query or body are checked with zod before the controller runs: an object where a string
belongs, a quantity sent as a string or an unknown key answers 400 with `fields`, never 500. An unexpected server
error answers `Internal server error`; with `EXPOSE_ERROR_DETAILS=true` (not in production) `error` carries the real
message and a `stack`.
