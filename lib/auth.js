import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const AUTH_SECRET = process.env.Liftrz_AUTH_SECRET || process.env.AUTH_SECRET;
if (!AUTH_SECRET) {
  throw new Error('Liftrz_AUTH_SECRET environment variable is required. Set a strong random string.');
}
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const decode = (value) => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

export const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(password || ''), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
};

export const verifyPassword = (user, password) => {
  if (!user) return false;

  if (user.passwordHash?.startsWith('scrypt$')) {
    const [, salt, storedHash] = user.passwordHash.split('$');
    const candidateHash = scryptSync(String(password || ''), salt, 64).toString('hex');
    return timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(candidateHash, 'hex'));
  }

  return user.password === password;
};

export const createAuthToken = (user) => {
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    sub: user.id,
    role: user.role,
    trainerId: user.trainerId || null,
    exp: Date.now() + TOKEN_TTL_MS
  });
  const signature = createHmac('sha256', AUTH_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
};

export const readAuthToken = (token) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expected = createHmac('sha256', AUTH_SECRET).update(`${header}.${payload}`).digest('base64url');
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const parsed = decode(payload);
  if (!parsed?.sub || !parsed?.role || Number(parsed.exp || 0) < Date.now()) {
    return null;
  }

  return parsed;
};

export const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, passwordHash, ...safe } = user;
  return safe;
};
