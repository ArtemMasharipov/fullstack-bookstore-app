import { checkSchema } from 'express-validator';
import Book from '../src/v1/models/book/bookModel.mjs';

const cartValidationSchema = checkSchema({
  bookId: {
    in: ['body'],
    isMongoId: {
      errorMessage: 'Invalid book ID format',
    },
    notEmpty: {
      errorMessage: 'Book ID is required',
    },
    custom: {
      options: async (value) => {
        const book = await Book.findById(value);
        if (!book) {
          throw new Error('Book not found');
        }
        return true;
      }
    }
  },
  quantity: {
    in: ['body'],
    isInt: {
      options: { min: 1, max: 99 },
      errorMessage: 'Quantity must be between 1 and 99',
    },
    notEmpty: {
      errorMessage: 'Quantity is required',
    },
    toInt: true
  }
});

export const cartItemUpdateValidationSchema = checkSchema({
  quantity: {
    in: ['body'],
    isInt: {
      options: { min: 1, max: 99 },
      errorMessage: 'Quantity must be between 1 and 99',
    },
    notEmpty: {
      errorMessage: 'Quantity is required',
    },
    toInt: true
  },
  itemId: {
    in: ['params'],
    isMongoId: {
      errorMessage: 'Invalid item ID format',
    },
    notEmpty: {
      errorMessage: 'Item ID is required',
    }
  }
});

export default cartValidationSchema;
