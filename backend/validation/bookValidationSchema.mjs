import { checkSchema } from 'express-validator';

const bookValidationSchema = checkSchema({
  title: {
    trim: true,
    escape: true,
    isLength: {
      options: { min: 3, max: 100 },
      errorMessage: 'Title must be between 3 and 100 characters long.',
    },
    notEmpty: {
      errorMessage: 'Title is required.',
    },
  },
  authorId: {
    notEmpty: {
      errorMessage: 'Author is required.',
    },
    isMongoId: {
      errorMessage: 'Invalid author ID format',
    },
  },
  publicationYear: {
    isInt: {
      options: { min: 1000, max: new Date().getFullYear() },
      errorMessage: 'Publication year must be a valid year.',
    },
    notEmpty: {
      errorMessage: 'Publication year is required.',
    },
  },
  category: {
    trim: true,
    escape: true,
    isLength: {
      options: { min: 3, max: 50 },
      errorMessage: 'Category must be between 3 and 50 characters long.',
    },
    notEmpty: {
      errorMessage: 'Category is required.',
    },
  },
  imgBase64: {
    optional: true,
    isBase64: {
      errorMessage: 'Image must be a valid base64 string.',
    },
  },
});

export default bookValidationSchema;
