import mongoose from 'mongoose'

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: [true, 'Author is required'],
      index: true,
    },
    publicationYear: {
      type: Number,
      required: [true, 'Publication year is required'],
      min: [1450, 'Publication year cannot be before 1450'],
      max: [
        () => new Date().getFullYear(),
        'Publication year cannot be in the future',
      ],
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      max: [999999.99, 'Price is too high'],
    },
    image: {
      type: String,
    },
    inStock: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for search and performance
bookSchema.index({ title: 'text', description: 'text' })
bookSchema.index({ category: 1, inStock: 1 })
bookSchema.index({ author: 1, createdAt: -1 })
bookSchema.index({ price: 1, inStock: 1 })

// Virtual field
bookSchema.virtual('isAvailable').get(function () {
  return this.inStock
})

// Static methods
bookSchema.statics.findAvailable = function (filters = {}) {
  return this.find({ ...filters, inStock: true })
    .populate('author', 'firstName lastName')
    .sort('-createdAt')
}

bookSchema.statics.searchBooks = function (searchTerm) {
  return this.find(
    {
      $text: { $search: searchTerm },
    },
    {
      score: { $meta: 'textScore' },
    }
  )
    .populate('author', 'firstName lastName')
    .sort({ score: { $meta: 'textScore' } })
}

// Model middleware - Keep lightweight, business logic is in service
bookSchema.pre('save', async function (next) {
  // Basic validation only - detailed checks are in service layer
  if (this.publicationYear > new Date().getFullYear()) {
    return next(new Error('Publication year cannot be in the future'))
  }
  next()
})

bookSchema.post('save', async function (doc) {
  try {
    // Update author's books list
    const Author = mongoose.model('Author')
    await Author.findByIdAndUpdate(
      doc.author,
      { $addToSet: { books: doc._id } },
      { new: true }
    )
  } catch (error) {
    // Ignore errors in post-save hook
    console.error('Error updating author books:', error)
  }
})

bookSchema.pre('remove', async function (next) {
  try {
    // Remove book from author's books list
    const Author = mongoose.model('Author')
    await Author.findByIdAndUpdate(this.author, { $pull: { books: this._id } })
    next()
  } catch (error) {
    next(error)
  }
})

export default mongoose.model('Book', bookSchema)
