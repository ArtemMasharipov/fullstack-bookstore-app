/**
 * User Model
 * Schema for user authentication and profile
 */

import bcrypt from 'bcrypt'
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [50, 'Username cannot exceed 50 characters'],
      index: true,
      validate: {
        validator: function (v) {
          // Alphanumeric, underscore, hyphen only
          return /^[a-zA-Z0-9_-]+$/.test(v)
        },
        message:
          'Username can only contain letters, numbers, underscores and hyphens',
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        },
        message: 'Invalid email format',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
      index: true,
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Remove sensitive fields from JSON output
        delete ret.password
        delete ret.__v
        return ret
      },
    },
    toObject: { virtuals: true },
  }
)

// Indexes for performance
userSchema.index({ email: 1, isActive: 1 })
userSchema.index({ username: 1, isActive: 1 })
userSchema.index({ role: 1, isActive: 1 })
userSchema.index({ createdAt: -1 })

// Virtual field - full name
userSchema.virtual('fullName').get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`
  }
  return this.username
})

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Instance method - compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw new Error('Password comparison failed')
  }
}

// Instance method - update last login
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date()
  return this.save()
}

// Static method - find active users
userSchema.statics.findActive = function (filters = {}) {
  return this.find({ ...filters, isActive: true })
    .select('-password')
    .sort('-createdAt')
}

// Static method - find by role
userSchema.statics.findByRole = function (role) {
  return this.find({ role, isActive: true })
    .select('-password')
    .sort('-createdAt')
}

export default mongoose.model('User', userSchema)
