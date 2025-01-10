import { checkSchema } from 'express-validator';

const orderValidationSchema = checkSchema({
  shippingAddress: {
    isObject: {
      errorMessage: 'Shipping address must be an object',
    },
    notEmpty: {
      errorMessage: 'Shipping address is required',
    },
    custom: {
      options: (value) => {
        const requiredFields = ['street', 'city', 'country', 'zipCode'];
        const missingFields = requiredFields.filter(field => !value[field]);
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        return true;
      }
    }
  },
  'shippingAddress.street': {
    trim: true,
    notEmpty: {
      errorMessage: 'Street address is required',
    },
    isLength: {
      options: { min: 5, max: 100 },
      errorMessage: 'Street address must be between 5 and 100 characters',
    }
  },
  'shippingAddress.city': {
    trim: true,
    notEmpty: {
      errorMessage: 'City is required',
    },
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: 'City must be between 2 and 50 characters',
    }
  },
  'shippingAddress.country': {
    trim: true,
    notEmpty: {
      errorMessage: 'Country is required',
    },
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: 'Country must be between 2 and 50 characters',
    }
  },
  'shippingAddress.zipCode': {
    trim: true,
    notEmpty: {
      errorMessage: 'Zip code is required',
    },
    isLength: {
      options: { min: 3, max: 10 },
      errorMessage: 'Zip code must be between 3 and 10 characters',
    }
  }
});

export default orderValidationSchema;
