import bcrypt from 'bcrypt'
import { UserUseCases } from '../../../application/use-cases/UserUseCases.js'
import { MongoUserRepository } from '../../../infrastructure/repositories/MongoUserRepository.js'
import { prepareToken, verifyToken } from '../../../shared/utils/jwtHelpers.js'

const userUseCases = new UserUseCases()
const userRepository = new MongoUserRepository()

export const authController = {
  async register(req, res, next) {
    try {
      const { username, email, password, roleName = 'user' } = req.body

      const existingUser = await userUseCases.getUserByEmail(email)
      if (existingUser) {
        return res
          .status(400)
          .json({ error: 'User with this email already exists' })
      }

      const user = await userUseCases.createUser({
        username,
        email,
        password,
        roleName,
      })

      const token = prepareToken({
        id: user.id,
        email: user.email,
        role: user.role,
      })

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      })
    } catch (error) {
      next(error)
    }
  },
  async login(req, res, next) {
    try {
      const { email, password } = req.body

      const user = await userRepository.findByEmail(email)
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      const token = prepareToken({
        id: user.id,
        email: user.email,
        role: user.role,
      })

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      })
    } catch (error) {
      next(error)
    }
  },
  async logout(req, res, next) {
    try {
      res.json({ message: 'Logout successful' })
    } catch (error) {
      next(error)
    }
  },
  async verifyToken(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')

      if (!token) {
        return res.status(401).json({ error: 'No token provided' })
      }

      const decoded = verifyToken(token)
      const user = await userUseCases.getUserById(decoded.id)

      if (!user) {
        return res.status(401).json({ error: 'User not found' })
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      })
    } catch (error) {
      if (
        error.name === 'JsonWebTokenError' ||
        error.name === 'TokenExpiredError'
      ) {
        return res.status(401).json({ error: 'Invalid or expired token' })
      }
      next(error)
    }
  },
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body
      const userId = req.user.id

      const user = await userUseCases.getUserById(userId)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      )
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' })
      }

      await userUseCases.updateUser(userId, { password: newPassword })

      res.json({ message: 'Password changed successfully' })
    } catch (error) {
      next(error)
    }
  },
}
