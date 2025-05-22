import jwt from 'jsonwebtoken';
import config from '../config/default.mjs';

export function prepareToken(data) {
  const { password, ...tokenData } = data;
  return jwt.sign(tokenData, config.jwt.secret, {
    expiresIn: config.jwt.expiration,
    audience: config.jwt.audience,
    issuer: config.jwt.issuer,
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret, {
      audience: config.jwt.audience,
      issuer: config.jwt.issuer,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}

export function extractToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Invalid token format');
  }
  return authHeader.split(' ')[1];
}
