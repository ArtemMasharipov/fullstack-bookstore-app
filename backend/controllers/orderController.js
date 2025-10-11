/**
 * Order Controller Layer
 * Handles HTTP requests/responses for orders
 */

import * as orderService from '../services/orderService.js';

/**
 * @route   POST /api/v1/orders
 * @desc    Create order from cart
 * @access  Private
 */
export async function createOrder(req, res) {
  const order = await orderService.createOrder(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: order,
    message: 'Order created successfully'
  });
}

/**
 * @route   GET /api/v1/orders
 * @desc    Get user's orders
 * @access  Private
 */
export async function getUserOrders(req, res) {
  const result = await orderService.getUserOrders(req.user.id, req.query);

  res.status(200).json({
    success: true,
    data: result.orders,
    pagination: result.pagination
  });
}

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
export async function getOrder(req, res) {
  const order = await orderService.getOrderById(req.params.id, req.user.id);

  res.status(200).json({
    success: true,
    data: order
  });
}

/**
 * @route   PATCH /api/v1/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 */
export async function cancelOrder(req, res) {
  const order = await orderService.cancelOrder(req.params.id, req.user.id);

  res.status(200).json({
    success: true,
    data: order,
    message: 'Order cancelled successfully'
  });
}

// =============================================================================
// ADMIN OPERATIONS
// =============================================================================

/**
 * @route   GET /api/v1/orders/admin/all
 * @desc    Get all orders
 * @access  Private/Admin
 */
export async function getAllOrders(req, res) {
  const result = await orderService.getAllOrders(req.query);

  res.status(200).json({
    success: true,
    data: result.orders,
    pagination: result.pagination
  });
}

/**
 * @route   PATCH /api/v1/orders/:id/status
 * @desc    Update order status
 * @access  Private/Admin
 */
export async function updateOrderStatus(req, res) {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'Status is required'
    });
  }

  const order = await orderService.updateOrderStatus(req.params.id, status);

  res.status(200).json({
    success: true,
    data: order,
    message: 'Order status updated successfully'
  });
}

/**
 * @route   PATCH /api/v1/orders/:id/pay
 * @desc    Mark order as paid
 * @access  Private/Admin
 */
export async function markOrderAsPaid(req, res) {
  const order = await orderService.markOrderAsPaid(req.params.id);

  res.status(200).json({
    success: true,
    data: order,
    message: 'Order marked as paid'
  });
}

/**
 * @route   GET /api/v1/orders/admin/stats
 * @desc    Get order statistics
 * @access  Private/Admin
 */
export async function getOrderStats(req, res) {
  const stats = await orderService.getOrderStats();

  res.status(200).json({
    success: true,
    data: stats
  });
}
