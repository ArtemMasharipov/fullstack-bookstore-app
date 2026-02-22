/**
 * Routes Index
 * Central place to import and configure all routes
 */

import express from "express";
import authRoutes from "./auth.js";
import authorRoutes from "./authors.js";
import bookRoutes from "./books.js";
import cartRoutes from "./cart.js";
import orderRoutes from "./orders.js";
import userRoutes from "./users.js";

const router = express.Router();

// API v1 routes
router.use("/books", bookRoutes);
router.use("/authors", authorRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);

// Health check route
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// API info route
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Bookstore API - Clean MVC",
    version: "1.0.0",
    endpoints: {
      books: "/api/v1/books",
      authors: "/api/v1/authors",
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      cart: "/api/v1/cart",
      orders: "/api/v1/orders",
      health: "/api/v1/health",
    },
  });
});

export default router;
