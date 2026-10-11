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
├── services/        # Business logic; throws the errors of utils/errors.js
├── models/          # Mongoose schemas
├── middleware/      # auth (protect, authorize), errorHandler, requestLogger, asyncHandler
├── utils/           # Error classes
├── scripts/         # seed.js, seed-data.js, e2e-server.js
└── tests/           # unit and integration tests (vitest)
```

## API

Base path: `/api/v1`. The paths below are relative to it. Query parameters and request bodies are documented in the
comment above each route in [`routes/`](routes).

Access: **Public** needs no token; **User** needs a valid token of any role; **Admin** needs a token of a user whose
role is `admin`.

### Service

| Method | Path      | Access | Description                              |
| ------ | --------- | ------ | ---------------------------------------- |
| GET    | `/health` | Public | Health check                             |
| GET    | `/`       | Public | API info with the list of resource paths |

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

### Cart (`/cart`, every route needs a token)

| Method | Path             | Access | Description                                  |
| ------ | ---------------- | ------ | -------------------------------------------- |
| GET    | `/cart`          | User   | The user's cart                              |
| GET    | `/cart/validate` | User   | Validate the cart before checkout            |
| POST   | `/cart`          | User   | Add an item                                  |
| POST   | `/cart/sync`     | User   | Sync with current prices and availability    |
| PUT    | `/cart/:bookId`  | User   | Change the quantity of an item               |
| DELETE | `/cart/:bookId`  | User   | Remove an item                               |
| DELETE | `/cart`          | User   | Clear the cart                               |

### Orders (`/orders`, every route needs a token)

| Method | Path                  | Access | Description              |
| ------ | --------------------- | ------ | ------------------------ |
| POST   | `/orders`             | User   | Create an order from the cart |
| GET    | `/orders`             | User   | The user's orders        |
| GET    | `/orders/:id`         | User   | One order                |
| PATCH  | `/orders/:id/cancel`  | User   | Cancel an order          |
| GET    | `/orders/admin/all`   | Admin  | All orders               |
| GET    | `/orders/admin/stats` | Admin  | Order statistics         |
| PATCH  | `/orders/:id/status`  | Admin  | Change the order status  |
| PATCH  | `/orders/:id/pay`     | Admin  | Mark an order as paid    |

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

Error: `{ "success": false, "error": "Description" }`. A validation error also has an `errors` array with one message
per invalid field. An unexpected server error answers `Internal server error`; with `EXPOSE_ERROR_DETAILS=true`
(not in production) the response carries the real message and a `stack`.
