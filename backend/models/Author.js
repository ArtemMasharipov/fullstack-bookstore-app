import mongoose from 'mongoose';

const authorSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters'],
    index: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    index: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [2000, 'Bio cannot exceed 2000 characters'],
    default: ''
  },
  birthYear: {
    type: Number,
    min: [1000, 'Birth year cannot be before 1000'],
    max: [new Date().getFullYear(), 'Birth year cannot be in the future']
  },
  country: {
    type: String,
    trim: true,
    maxlength: [100, 'Country cannot exceed 100 characters']
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  books: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for search and performance
authorSchema.index({ firstName: 1, lastName: 1 });
authorSchema.index({ firstName: 'text', lastName: 'text', bio: 'text' });
authorSchema.index({ country: 1, birthYear: 1 });
authorSchema.index({ createdAt: -1 });

// Virtual fields
authorSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

authorSchema.virtual('booksCount').get(function() {
  return this.books ? this.books.length : 0;
});

// Instance methods
authorSchema.methods.getWithBooks = async function() {
  return this.populate('books', 'title publicationYear price inStock');
};

authorSchema.methods.getBooksCount = async function() {
  const Book = mongoose.model('Book');
  return Book.countDocuments({ author: this._id });
};

// Static methods
authorSchema.statics.findWithBooks = function(filters = {}) {
  return this.find(filters)
    .populate('books', 'title publicationYear price inStock')
    .sort('-createdAt');
};

authorSchema.statics.searchAuthors = function(searchTerm) {
  return this.find({ 
    $text: { $search: searchTerm } 
  }, {
    score: { $meta: 'textScore' }
  })
    .sort({ score: { $meta: 'textScore' } });
};

// Model middleware
authorSchema.pre('remove', async function(next) {
  try {
    // Delete all books by this author
    const Book = mongoose.model('Book');
    await Book.deleteMany({ author: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('Author', authorSchema);

