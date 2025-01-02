import mongoose from 'mongoose';

const { Schema } = mongoose;

const bookSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      minlength: [2, 'Title must be at least 2 characters long'],
      maxlength: [100, 'Title must be at most 100 characters long'],
      trim: true,
    },
    publicationYear: {
      type: Number,
      required: [true, 'Publication year is required'],
      min: [1450, 'Year must be after the invention of the printing press'],
      max: [new Date().getFullYear(), 'Year cannot be in the future'],
    },
    imgBase64: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      required: false,
      trim: true,
      maxlength: [50, 'Category must be at most 50 characters long'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'Author',
      required: true,
    },
  },
  { timestamps: true },
);

bookSchema.pre('save', async function (next) {
  const Author = mongoose.model('Author');
  const authorExists = await Author.exists({ _id: this.author });

  if (!authorExists) {
    return next(new Error('Author does not exist'));
  }
  next();
});

bookSchema.post('save', async function (doc) {
  try {
    const Author = mongoose.model('Author');
    await Author.findByIdAndUpdate(
      doc.author,
      { $addToSet: { books: doc._id } },
      { new: true },
    );
  } catch (error) {
    console.error('Error updating author books:', error);
  }
});

const Book = mongoose.model('Book', bookSchema);

export default Book;
