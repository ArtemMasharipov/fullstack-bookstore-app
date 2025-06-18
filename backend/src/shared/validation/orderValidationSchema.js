import { body, param } from 'express-validator'

export const orderValidationSchema = {
  create: [
    body('items')
      .isArray({ min: 1 })
      .withMessage('Order must contain at least one item'),

    body('items.*.bookId').isMongoId().withMessage('Invalid book ID format'),

    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),

    body('items.*.price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),

    body('shippingAddress')
      .notEmpty()
      .withMessage('Shipping address is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Shipping address must be between 10 and 500 characters'),

    body('paymentMethod')
      .isIn(['credit_card', 'debit_card', 'paypal', 'cash_on_delivery'])
      .withMessage('Invalid payment method'),

    body('totalAmount')
      .isFloat({ min: 0 })
      .withMessage('Total amount must be a positive number'),
  ],

  update: [
    body('status')
      .optional()
      .isIn([
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ])
      .withMessage('Invalid order status'),

    body('shippingAddress')
      .optional()
      .isLength({ min: 10, max: 500 })
      .withMessage('Shipping address must be between 10 and 500 characters'),

    body('trackingNumber')
      .optional()
      .isLength({ min: 5, max: 50 })
      .withMessage('Tracking number must be between 5 and 50 characters'),
  ],

  updateStatus: [
    body('status')
      .isIn([
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ])
      .withMessage('Invalid order status'),
  ],

  params: [
    param('id').isMongoId().withMessage('Invalid order ID format'),

    param('userId')
      .optional()
      .isMongoId()
      .withMessage('Invalid user ID format'),
  ],
}
