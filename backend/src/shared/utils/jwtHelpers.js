import jwt from 'jsonwebtoken'
import config from '../../../config/default.mjs'

export function prepareToken(data) {
  const { password, ...tokenData } = data
  return jwt.sign(tokenData, config.jwt.secret, {
    expiresIn: config.jwt.expiration,
    audience: config.jwt.audience,
    issuer: config.jwt.issuer,
  })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret, {
      audience: config.jwt.audience,
      issuer: config.jwt.issuer,
    })
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired')
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token')
    } else {
      throw new Error('Token verification failed')
    }
  }
}

export function extractToken(authHeader) {
  if (!authHeader) {
    throw new Error('Authentication token is required')
  }

  const [bearer, token] = authHeader.split(' ')
  if (bearer !== 'Bearer' || !token) {
    throw new Error('Invalid token format')
  }

  return token
}
