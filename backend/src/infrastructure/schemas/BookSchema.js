import mongoose from 'mongoose'

const { Schema } = mongoose

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
    image: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      required: false,
      trim: true,
      maxlength: [50, 'Category must be at most 50 characters long'],
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: [1000, 'Description must be at most 1000 characters long'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'Author',
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Book price is required'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: function (v) {
          return v >= 0 && v <= 999999.99
        },
        message: 'Price must be between 0 and 999999.99',
      },
    },
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

bookSchema.pre('save', async function (next) {
  const Author = mongoose.model('Author')
  const authorExists = await Author.exists({ _id: this.author })

  if (!authorExists) {
    return next(new Error('Author does not exist'))
  }
  next()
})

bookSchema.post('save', async function (doc) {
  try {
    const Author = mongoose.model('Author')
    await Author.findByIdAndUpdate(
      doc.author,
      { $addToSet: { books: doc._id } },
      { new: true }
    )
  } catch (error) {
    // Ignore errors in post-save hook
  }
})

const Book = mongoose.model('Book', bookSchema)

export default Book
