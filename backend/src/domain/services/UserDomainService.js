import bcrypt from 'bcrypt'

/**
 * Domain Service for User Business Logic
 */
export class UserDomainService {
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  }

  static async validatePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword)
  }

  static validateUserCreation(userData) {
    const { username, email, password } = userData

    if (!username || username.length < 3 || username.length > 50) {
      throw new Error('Username must be between 3 and 50 characters')
    }

    if (!email || !this.isValidEmail(email)) {
      throw new Error('Valid email is required')
    }

    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters long')
    }

    return true
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static sanitizeUserData(userData) {
    const { password, ...sanitizedData } = userData
    return sanitizedData
  }

  static validateUserUpdate(updateData) {
    if (
      updateData.username &&
      (updateData.username.length < 3 || updateData.username.length > 50)
    ) {
      throw new Error('Username must be between 3 and 50 characters')
    }

    if (updateData.email && !this.isValidEmail(updateData.email)) {
      throw new Error('Valid email is required')
    }

    if (updateData.password && updateData.password.length < 4) {
      throw new Error('Password must be at least 4 characters long')
    }

    return true
  }
}
