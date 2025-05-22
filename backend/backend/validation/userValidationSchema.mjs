import { checkSchema } from 'express-validator';
import User from '../src/v1/models/user/userModel.mjs';

const userValidationSchema = checkSchema({
  username: {
    trim: true,
    escape: true,
    isLength: {
      options: { min: 3, max: 50 },
      errorMessage: 'Username must be between 3 and 50 characters long.',
    },
    notEmpty: {
      errorMessage: 'Username is required.',
    },
  },
  email: {
    isEmail: {
      errorMessage: 'Invalid email format.',
    },
    normalizeEmail: true,
    notEmpty: {
      errorMessage: 'Email is required.',
    },
    custom: {
      options: async (value) => {
        const user = await User.findOne({ email: value });
        if (user) throw new Error('Email already in use.');
      },
    },
  },
  password: {
    isLength: {
      options: { min: 8 },
      errorMessage: 'Password must be at least 8 characters long.',
    },
    matches: {
      options: /(?=.*\d)/,
      errorMessage: 'Password must contain at least one digit.',
    },
    notEmpty: {
      errorMessage: 'Password is required.',
    },
  },
  confirmPassword: {
    custom: {
      options: (value, { req }) => value === req.body.password,
      errorMessage: 'Passwords must match.',
    },
  },
});

export default userValidationSchema;
