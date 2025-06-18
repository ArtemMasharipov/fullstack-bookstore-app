import mongoose from 'mongoose'

const { Schema } = mongoose

const authorSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Author name is required'],
      minlength: [3, 'Name must be at least 3 characters long'],
      maxlength: [100, 'Name must be at most 100 characters long'],
      trim: true,
    },
    biography: {
      type: String,
      maxlength: [2000, 'Biography cannot exceed 2000 characters'],
      default: null,
      trim: true,
    },
    books: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Book',
      },
    ],
  },
  { timestamps: true }
)

authorSchema.methods.getWithBooks = async function () {
  return this.populate('books').execPopulate()
}

authorSchema.pre('remove', async function (next) {
  try {
    const Book = mongoose.model('Book')
    await Book.deleteMany({ author: this._id })
    next()
  } catch (error) {
    next(error)
  }
})

const Author = mongoose.model('Author', authorSchema)

export default Author
