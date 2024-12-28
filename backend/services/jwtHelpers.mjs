import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const secretKey = process.env.JWT_SECRET;
const tokenExpiration = process.env.JWT_EXPIRATION || '60m';

export function prepareToken(data) {
  const { password, ...tokenData } = data;
  return jwt.sign(tokenData, secretKey, {
    expiresIn: tokenExpiration,
    audience: process.env.JWT_AUDIENCE,
    issuer: process.env.JWT_ISSUER,
  });
}

export function parseBearer(bearer) {
  if (!bearer.startsWith('Bearer ')) {
    throw new Error('Invalid token format');
  }

  const token = bearer.slice(7);

  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else {
      throw new Error('Invalid token');
    }
  }
}
