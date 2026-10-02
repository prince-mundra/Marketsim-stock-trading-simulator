export function validateRegistration(req, res, next) {
  const { name, email, password } = req.body || {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    return res.status(400).json({ message: 'Name must be between 2 and 80 characters.' });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and no more than 72 bytes.' });
  }
  return next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  return next();
}

export function parseTradeQuantity(req, res, next) {
  const quantity = Number(req.body?.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return res.status(400).json({ message: 'Quantity must be greater than zero.' });
  }
  req.body.quantity = quantity;
  return next();
}

export function normalizeSymbol(req, res, next) {
  const raw = req.params.symbol || req.body?.symbol;
  if (raw) {
    const symbol = String(raw).trim().toUpperCase();
    if (!/^[A-Z0-9.-]{1,20}$/.test(symbol)) {
      return res.status(400).json({ message: 'Enter a valid stock symbol.' });
    }
    req.params.symbol = symbol;
    if (req.body) req.body.symbol = symbol;
  }
  return next();
}
