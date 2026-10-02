import jwt from 'jsonwebtoken';

export function generateToken(user, secret) {
  return jwt.sign(
    { sub: String(user._id), email: user.email },
    secret,
    { algorithm: 'HS256', expiresIn: '7d', issuer: 'stocksim-paper-trading' },
  );
}
