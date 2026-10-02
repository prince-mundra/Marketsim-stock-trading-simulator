import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  virtualBalance: user.virtualBalance,
  createdAt: user.createdAt,
});

function setSessionCookie(res, token) {
  const secure = res.app.locals.cookieSecure;
  res.cookie('papertrade_session', token, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function register(req, res) {
  const email = req.body.email.trim().toLowerCase();
  if (await User.exists({ email })) return res.status(409).json({ message: 'An account with that email already exists.' });

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await User.create({ name: req.body.name.trim(), email, passwordHash });
  setSessionCookie(res, generateToken(user, req.app.locals.jwtSecret));
  return res.status(201).json({ user: publicUser(user) });
}

export async function login(req, res) {
  const user = await User.findOne({ email: req.body.email.trim().toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  setSessionCookie(res, generateToken(user, req.app.locals.jwtSecret));
  return res.json({ user: publicUser(user) });
}

export function getMe(req, res) {
  return res.json({ user: publicUser(req.user) });
}

export function logout(req, res) {
  const secure = req.app.locals.cookieSecure;
  res.clearCookie('papertrade_session', {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
  });
  return res.json({ message: 'Signed out.' });
}
