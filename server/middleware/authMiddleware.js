import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const bearer = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    const token = bearer || req.cookies?.papertrade_session;
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });

    const payload = jwt.verify(token, req.app.locals.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'stocksim-paper-trading',
    });
    const user = await User.findById(payload.sub).select('_id name email virtualBalance');
    if (!user) return res.status(401).json({ message: 'Your session is no longer valid. Please sign in again.' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Your session is invalid or expired. Please sign in again.' });
  }
}
