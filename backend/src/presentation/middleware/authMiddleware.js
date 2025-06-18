import { MongoUserRepository } from '../../infrastructure/repositories/MongoUserRepository.js'
import { extractToken, verifyToken } from '../../shared/utils/jwtHelpers.js'

const userRepository = new MongoUserRepository()

export const checkAuth = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization)
    const decoded = verifyToken(token)

    const userWithPermissions = await userRepository.findWithRole(decoded.id)
    if (!userWithPermissions) {
      throw new Error('Invalid token')
    }

    req.user = userWithPermissions
    next()
  } catch (error) {
    res.status(401).json({ message: error.message })
  }
}

export const checkPermission = requiredPermission => (req, res, next) => {
  const permissions =
    req.user?.role?.permissions?.map(p => p.toLowerCase()) || []
  if (!permissions.includes(requiredPermission.toLowerCase())) {
    return res.status(403).json({ message: 'Permission denied' })
  }
  next()
}
