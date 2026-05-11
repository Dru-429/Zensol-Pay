import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'ZenSol Pay_token';

export function getCookieName() {
  return COOKIE_NAME;
}

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  let token = null;
  if (header?.startsWith('Bearer ')) token = header.slice(7);
  if (!token && req.cookies?.[COOKIE_NAME]) token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
