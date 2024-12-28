import { checkSchema } from 'express-validator';

const authorValidationSchema = checkSchema({
  name: {
    trim: true,
    escape: true,
    isLength: {
      options: { min: 3, max: 50 },
      errorMessage: 'Name must be between 3 and 50 characters long.',
    },
    notEmpty: {
      errorMessage: 'Name is required.',
    },
  },
  bio: {
    trim: true,
    escape: true,
    isLength: {
      options: { min: 10, max: 500 },
      errorMessage: 'Bio must be between 10 and 500 characters long.',
    },
    notEmpty: {
      errorMessage: 'Bio is required.',
    },
  },
});

export default authorValidationSchema;
