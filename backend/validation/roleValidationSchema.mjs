import { checkSchema } from 'express-validator';

const roleValidationSchema = checkSchema({
  name: {
    trim: true,
    escape: true,
    isLength: {
      options: { min: 3, max: 50 },
      errorMessage: 'Role name must be between 3 and 50 characters long.',
    },
    notEmpty: {
      errorMessage: 'Role name is required.',
    },
  },
});

export default roleValidationSchema;
