import { UserUseCases } from '../../../application/use-cases/UserUseCases.js'

const userUseCases = new UserUseCases()

export const userController = {
  async getAllUsers(req, res, next) {
    try {
      const users = await userUseCases.getAllUsers()
      res.json(users)
    } catch (error) {
      next(error)
    }
  },
  async getUserById(req, res, next) {
    try {
      const { id } = req.params
      const user = await userUseCases.getUserById(id)

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json(user)
    } catch (error) {
      next(error)
    }
  },
  async createUser(req, res, next) {
    try {
      const userData = req.body
      const user = await userUseCases.createUser(userData)
      res.status(201).json(user)
    } catch (error) {
      next(error)
    }
  },
  async updateUser(req, res, next) {
    try {
      const { id } = req.params
      const updateData = req.body
      const user = await userUseCases.updateUser(id, updateData)

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json(user)
    } catch (error) {
      next(error)
    }
  },
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params
      const user = await userUseCases.deleteUser(id)

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json({ message: 'User deleted successfully' })
    } catch (error) {
      next(error)
    }
  },
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id // Assuming auth middleware sets req.user
      const user = await userUseCases.getUserById(userId)

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json(user)
    } catch (error) {
      next(error)
    }
  },
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id
      const updateData = req.body
      const user = await userUseCases.updateUser(userId, updateData)

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json(user)
    } catch (error) {
      next(error)
    }
  },
}
