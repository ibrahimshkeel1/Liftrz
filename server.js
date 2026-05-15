import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createAuthToken, hashPassword, readAuthToken, sanitizeUser, verifyPassword } from './lib/auth.js';
import { createSQLiteStore } from './lib/sqlite-store.js';
import { createSupabaseStore } from './lib/supabase-store.js';
import { email } from './lib/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3010;
const isServerless = Boolean(process.env.VERCEL);
const normalizeSupabaseUrl = (value = '') => {
  const cleaned = String(value).trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/g, '');
  const projectRoot = cleaned.match(/^(https?:\/\/[^/]+\.supabase\.co)(?:\/.*)?$/i);
  if (projectRoot) return projectRoot[1];
  return cleaned.replace(/\/(rest|storage)\/v1.*$/i, '');
};
const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const useSupabase = Boolean(supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY);
const requireDurableStore = isServerless;
const sqliteStore = createSQLiteStore({
  rootDir: __dirname,
  seedFile: path.join(__dirname, 'db.json'),
  isServerless
});
const supabaseStore = useSupabase
  ? createSupabaseStore({
      seedFile: path.join(__dirname, 'db.json')
    })
  : null;

const readDB = async () => {
  if (supabaseStore) {
    return supabaseStore.readDB();
  }
  if (requireDurableStore) {
    throw new Error('Supabase is not configured for production persistence.');
  }
  return sqliteStore.readDB();
};

const writeDB = async (data) => {
  if (supabaseStore) {
    return supabaseStore.writeDB(data);
  }
  if (requireDurableStore) {
    throw new Error('Supabase is not configured for production persistence.');
  }
  return sqliteStore.writeDB(data);
};

const corsOrigin = process.env.CORS_ORIGIN || (isServerless ? '' : 'http://localhost:3000');
const corsOptions = corsOrigin ? { origin: corsOrigin, credentials: true } : undefined;
app.use(cors(corsOptions));
app.use(express.json({ limit: '12mb' }));
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// NOTE: Vercel serverless functions do not share memory between invocations.
// These limits are intentionally high so legitimate users are not blocked.
// For production, migrate to Redis-backed rate limiting (e.g., upstash-ratelimit).
const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ message: 'Too many requests. Please try again later.' })
});

const strictAuthRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ message: 'Too many login attempts. Please try again later.' })
});

const sanitizeString = (value, maxLength = 500) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^[\+\d\s\-]{7,20}$/.test(phone);

const validateBody = (rules) => (req, res, next) => {
  const errors = [];
  for (const [key, rule] of Object.entries(rules)) {
    const value = req.body[key];
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors.push(`${key} is required`);
      continue;
    }
    if (value && rule.maxLength && String(value).length > rule.maxLength) {
      errors.push(`${key} must be at most ${rule.maxLength} characters`);
    }
    if (value && rule.pattern && !rule.pattern.test(String(value))) {
      errors.push(`${key} format is invalid`);
    }
  }
  if (errors.length) {
    return res.status(400).json({ message: 'Validation error', errors });
  }
  next();
};

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const parseAmount = (value) => Number(String(value || 0).replace(/,/g, '')) || 0;
const route = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
const allowedUploadTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

const sanitizeFileName = (value = 'upload') => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9._-]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 80) || 'upload';

const decodeDataUrl = (dataUrl) => {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl || '');
  if (!match) return null;
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], 'base64')
  };
};

const storageHeaders = (extra = {}) => ({
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ...extra
});

const ensureStorageBucket = async (bucket) => {
  const baseUrl = supabaseUrl;
  const bucketUrl = `${baseUrl}/storage/v1/bucket/${bucket}`;
  const existing = await fetch(bucketUrl, {
    headers: storageHeaders()
  });

  if (existing.ok) return;
  if (existing.status !== 404) {
    const details = await existing.text().catch(() => '');
    throw new Error(`Storage bucket check failed: ${details || existing.statusText}`);
  }

  const created = await fetch(`${baseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: storageHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: false,
      file_size_limit: 5 * 1024 * 1024,
      allowed_mime_types: Array.from(allowedUploadTypes)
    })
  });

  if (!created.ok && created.status !== 409) {
    const details = await created.text().catch(() => '');
    throw new Error(`Storage bucket create failed: ${details || created.statusText}`);
  }
};

const uploadObject = async ({ bucket = 'Liftrz-private', folder = 'receipts', fileName, dataUrl }) => {
  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase storage is not configured.');
  }

  const decoded = decodeDataUrl(dataUrl);
  if (!decoded) throw new Error('Invalid upload data.');
  if (!allowedUploadTypes.has(decoded.contentType)) throw new Error('Unsupported file type.');
  if (decoded.buffer.length > 5 * 1024 * 1024) throw new Error('File is too large. Maximum size is 5MB.');

  await ensureStorageBucket(bucket);

  const ext = decoded.contentType === 'application/pdf'
    ? 'pdf'
    : decoded.contentType.split('/')[1].replace('jpeg', 'jpg');
  const objectPath = `${sanitizeFileName(folder)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeFileName(fileName || `receipt.${ext}`)}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`;
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: storageHeaders({
      'Content-Type': decoded.contentType,
      'x-upsert': 'true'
    }),
    body: decoded.buffer
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Upload failed: ${details || response.statusText}`);
  }

  return {
    bucket,
    path: objectPath,
    contentType: decoded.contentType,
    url: `/api/uploads/${bucket}/${objectPath}`
  };
};

const migrateLegacyUsers = async () => {
  const db = await readDB();
  let changed = false;
  db.users = db.users.map((user) => {
    const nextUser = { ...user };
    if (!nextUser.passwordHash) {
      nextUser.passwordHash = hashPassword(nextUser.password || 'Liftrz123');
      changed = true;
    }
    if (nextUser.password) {
      delete nextUser.password;
      changed = true;
    }
    return nextUser;
  });
  if (changed) {
    await writeDB(db);
  }
};

void migrateLegacyUsers().catch((error) => {
  console.error('Initial user migration failed:', error);
});

app.use(async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return next();

    const payload = readAuthToken(header.slice(7).trim());
    if (!payload?.sub) return next();

    const db = await readDB();
    const user = db.users.find((item) => item.id === payload.sub && item.status === 'active');
    if (user) {
      req.currentUser = user;
      req.auth = payload;
    }
    next();
  } catch (error) {
    next(error);
  }
});

const requireAuth = (req, res, next) => {
  if (!req.currentUser) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  return next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.currentUser) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!roles.includes(req.currentUser.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  return next();
};

const canAccessTrainer = (user, trainerId) => user?.role === 'admin' || (user?.role === 'trainer' && user.trainerId === trainerId);
const canAccessClient = (user, clientId) => user?.role === 'admin' || (user?.role === 'client' && user.id === clientId);
const canAccessBooking = (user, booking) => (
  user?.role === 'admin'
  || (user?.role === 'trainer' && user.trainerId === booking?.trainerId)
  || (user?.role === 'client' && user.id === booking?.clientId)
);

const canChatBooking = (booking) => (
  booking?.paymentStatus === 'verified'
  && booking?.contactUnlocked === true
  && !['payment_rejected', 'cancelled'].includes(booking?.status)
);

const bookingMessages = (booking) => Array.isArray(booking?.messages) ? booking.messages : [];

const bookingReadState = (booking) => (booking?.readState && typeof booking.readState === 'object' ? booking.readState : {});

const bookingChatSummary = (booking, db) => {
  const messages = bookingMessages(booking);
  const latestMessage = messages[messages.length - 1] || null;
  return {
    id: booking.id,
    trainerId: booking.trainerId,
    trainerName: booking.trainerName,
    clientId: booking.clientId,
    clientName: booking.clientName,
    clientEmail: booking.clientEmail,
    clientPhone: booking.clientPhone,
    packageTitle: booking.packageTitle,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    contactUnlocked: booking.contactUnlocked,
    chatStatus: canChatBooking(booking) ? 'open' : 'locked',
    chatOpenedAt: booking.chatOpenedAt,
    messageCount: messages.length,
    unreadByClient: messages.filter((message) => bookingReadState(booking).client && new Date(message.createdAt).getTime() > new Date(bookingReadState(booking).client).getTime() && message.senderRole !== 'client').length,
    unreadByTrainer: messages.filter((message) => bookingReadState(booking).trainer && new Date(message.createdAt).getTime() > new Date(bookingReadState(booking).trainer).getTime() && message.senderRole !== 'trainer').length,
    unreadByAdmin: messages.filter((message) => bookingReadState(booking).admin && new Date(message.createdAt).getTime() > new Date(bookingReadState(booking).admin).getTime()).length,
    latestMessageAt: latestMessage?.createdAt || booking.chatOpenedAt || booking.verifiedAt || booking.createdAt,
    latestMessage,
    messages,
    trainer: db.trainers.find((trainer) => trainer.id === booking.trainerId)
      ? {
          id: booking.trainerId,
          name: booking.trainerName,
          city: db.trainers.find((trainer) => trainer.id === booking.trainerId)?.city,
          specialty: db.trainers.find((trainer) => trainer.id === booking.trainerId)?.specialty
        }
      : null
  };
};

const publicTrainer = (trainer, db) => {
  if (!trainer) return null;
  const { contactPhone, whatsapp, payoutAccount, rating: _fakeRating, reviews: _fakeReviews, completedBookings: _fakeCompleted, successRate: _fakeSuccess, avgFatLoss: _fakeFatLoss, clientRetention: _fakeRetention, totalRevenue: _fakeRevenue, ...safe } = trainer;
  const stats = db ? trainerStats(db, trainer.id) : {};
  return {
    ...safe,
    rating: stats.averageRating || 0,
    reviews: stats.reviewCount || 0,
    completedBookings: stats.completedClients || 0,
    activeClients: stats.activeClients || 0,
    commissionRate: trainer.commissionRate ?? db.platformSettings?.commissionRate ?? 0.15,
    contactPhone: trainer.phoneHidden ? undefined : contactPhone,
    whatsapp: trainer.phoneHidden ? undefined : whatsapp
  };
};

const trainerStats = (db, trainerId) => {
  const bookings = db.bookings.filter((booking) => booking.trainerId === trainerId);
  const activeBookings = bookings.filter((booking) => ['active', 'completed'].includes(booking.status));
  const reviews = db.reviews.filter((review) => review.trainerId === trainerId && review.status !== 'rejected');
  const grossRevenue = bookings.reduce((sum, booking) => sum + Number(booking.grossAmount || 0), 0);
  const commissionPaid = bookings.reduce((sum, booking) => sum + Number(booking.commissionAmount || 0), 0);
  const pendingPayout = db.payouts
    .filter((payout) => payout.trainerId === trainerId && payout.status !== 'paid')
    .reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
  const profileViews = db.statsEvents.filter((event) => event.trainerId === trainerId && event.type === 'profile_view').length;
  const inquiries = db.leads.filter((lead) => lead.trainerId === trainerId).length;
  const rating = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;

  return {
    profileViews,
    inquiries,
    bookings: bookings.length,
    activeClients: activeBookings.length,
    completedClients: bookings.filter((booking) => booking.status === 'completed').length,
    grossRevenue,
    commissionPaid,
    pendingPayout,
    averageRating: Number(rating.toFixed(1)),
    reviewCount: reviews.length,
    conversionRate: inquiries ? Number(((bookings.length / inquiries) * 100).toFixed(1)) : 0
  };
};

const marketplaceStats = (db) => {
  const verifiedBookings = db.bookings.filter((booking) => booking.paymentStatus === 'verified');
  const grossMerchandiseValue = verifiedBookings.reduce((sum, booking) => sum + Number(booking.grossAmount || 0), 0);
  const commissionEarned = verifiedBookings.reduce((sum, booking) => sum + Number(booking.commissionAmount || 0), 0);
  const pendingPayouts = db.payouts
    .filter((payout) => payout.status !== 'paid')
    .reduce((sum, payout) => sum + Number(payout.amount || 0), 0);

  return {
    grossMerchandiseValue,
    commissionEarned,
    pendingPayouts,
    totalClients: db.users.filter((user) => user.role === 'client').length,
    totalTrainers: db.trainers.length,
    approvedTrainers: db.trainers.filter((trainer) => trainer.verificationStatus === 'approved').length,
    pendingTrainerApprovals: db.trainers.filter((trainer) => trainer.verificationStatus === 'pending').length,
    activeBookings: db.bookings.filter((booking) => booking.status === 'active').length,
    pendingPaymentVerifications: db.payments.filter((payment) => payment.status === 'pending_verification').length,
    openDisputes: db.disputes.filter((dispute) => dispute.status === 'open').length
  };
};

app.get('/api/settings', route(async (_req, res) => {
  const db = await readDB();
  res.json(db.platformSettings);
}));

app.post('/api/auth/register', authRateLimiter, validateBody({
  name: { required: true, maxLength: 100 },
  email: { required: true, maxLength: 200, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { required: true, maxLength: 200 },
  phone: { required: false, maxLength: 20 },
  city: { required: false, maxLength: 100 }
}), route(async (req, res) => {
  const db = await readDB();
  const role = req.body.role === 'trainer' ? 'trainer' : 'client';
  const email = sanitizeString(req.body.email).toLowerCase();
  const name = sanitizeString(req.body.name, 100);
  const phone = sanitizeString(req.body.phone, 20);
  const city = sanitizeString(req.body.city || req.body.location, 100);
  const password = String(req.body.password || '');

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const emailTaken = db.users.some((user) => user.email?.toLowerCase() === email);
  if (emailTaken) return res.status(409).json({ message: 'Email already registered' });

  const referralCode = `CS${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const referredBy = req.body.referralCode
    ? db.users.find((u) => u.referralCode === String(req.body.referralCode).toUpperCase().trim())?.id
    : null;

  const user = {
    id: makeId(role),
    role,
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
    status: 'active',
    city,
    goals: Array.isArray(req.body.goals) ? req.body.goals.slice(0, 10).map((g) => sanitizeString(g, 50)) : [],
    referralCode,
    referredBy: referredBy || null,
    referralCredits: 0,
    createdAt: new Date().toISOString()
  };

  db.users.push(user);

  if (referredBy) {
    const referrerIndex = db.users.findIndex((u) => u.id === referredBy);
    if (referrerIndex !== -1) {
      db.users[referrerIndex].referralCredits = (db.users[referrerIndex].referralCredits || 0) + 500;
    }
  }

  await writeDB(db);
  res.status(201).json({ token: createAuthToken(user), user: sanitizeUser(user) });
}));

app.post('/api/auth/login', strictAuthRateLimiter, validateBody({
  email: { required: true, maxLength: 200 },
  password: { required: true, maxLength: 200 }
}), route(async (req, res) => {
  const db = await readDB();
  const email = sanitizeString(req.body.email).toLowerCase();
  const user = db.users.find((item) => item.email?.toLowerCase() === email);

  if (!user || !verifyPassword(user, req.body.password)) {
    return res.status(401).json({ message: 'Invalid login' });
  }

  if (!user.passwordHash || user.password) {
    const index = db.users.findIndex((item) => item.id === user.id);
    const nextUser = { ...user, passwordHash: user.passwordHash || hashPassword(req.body.password) };
    delete nextUser.password;
    db.users[index] = nextUser;
    await writeDB(db);
    return res.json({ token: createAuthToken(nextUser), user: sanitizeUser(nextUser) });
  }

  res.json({ token: createAuthToken(user), user: sanitizeUser(user) });
}));

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: sanitizeUser(req.currentUser) });
});

app.get('/api/auth/referral/:code', route(async (req, res) => {
  const db = await readDB();
  const user = db.users.find((u) => u.referralCode === String(req.params.code).toUpperCase().trim());
  if (!user) return res.status(404).json({ message: 'Invalid referral code' });
  res.json({ valid: true, referrerName: user.name });
}));

app.post('/api/auth/reset-password', strictAuthRateLimiter, validateBody({
  email: { required: true, maxLength: 200, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
}), route(async (req, res) => {
  const db = await readDB();
  const email = sanitizeString(req.body.email).toLowerCase();
  const user = db.users.find((item) => item.email?.toLowerCase() === email);
  // Always return success to prevent email enumeration
  if (!user) {
    return res.json({ message: 'If an account exists, a reset link has been sent.' });
  }
  const token = makeId('reset');
  const expiry = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour
  db.passwordResets = db.passwordResets || [];
  db.passwordResets.push({ token, userId: user.id, email, expiry, used: false });
  await writeDB(db);

  void email.passwordReset({ toEmail: user.email, token });

  res.json({ message: 'If an account exists, a reset link has been sent.' });
}));

app.post('/api/auth/reset-password/:token', strictAuthRateLimiter, validateBody({
  password: { required: true, maxLength: 200 }
}), route(async (req, res) => {
  const db = await readDB();
  const reset = db.passwordResets?.find((item) => item.token === req.params.token && !item.used && new Date(item.expiry) > new Date());
  if (!reset) {
    return res.status(400).json({ message: 'Invalid or expired reset token.' });
  }
  const password = String(req.body.password || '');
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  const userIndex = db.users.findIndex((item) => item.id === reset.userId);
  if (userIndex === -1) {
    return res.status(400).json({ message: 'User not found.' });
  }
  db.users[userIndex].passwordHash = hashPassword(password);
  reset.used = true;
  await writeDB(db);
  res.json({ message: 'Password has been reset. You can now log in.' });
}));

app.get('/api/trainers', route(async (req, res) => {
  const db = await readDB();
  const includePending = req.query.includePending === 'true' && req.currentUser?.role === 'admin';
  const trainers = db.trainers
    .filter((trainer) => includePending || (trainer.verificationStatus === 'approved' && trainer.profileStatus === 'live'))
    .map((trainer) => ({ trainer, stats: trainerStats(db, trainer.id) }))
    .sort((a, b) => {
      const scoreA = Number(a.stats.completedClients || 0) * 2 + Number(a.stats.averageRating || 0) * 10 + Number(a.trainer.profileCompleteness || 0);
      const scoreB = Number(b.stats.completedClients || 0) * 2 + Number(b.stats.averageRating || 0) * 10 + Number(b.trainer.profileCompleteness || 0);
      return scoreB - scoreA;
    })
    .map(({ trainer }) => publicTrainer(trainer, db));
  res.json(trainers);
}));

app.get('/api/trainers/:id', route(async (req, res) => {
  const db = await readDB();
  const trainer = db.trainers.find((item) => item.id === req.params.id);
  if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
  res.json(publicTrainer(trainer, db));
}));

app.post('/api/trainers', route(async (req, res) => {
  const db = await readDB();
  const email = req.body.email?.toLowerCase()?.trim();
  const emailTaken = db.users.some((user) => user.email?.toLowerCase() === email);
  if (emailTaken) return res.status(409).json({ message: 'Email already registered' });

  const trainerId = req.body.id || makeId('trainer');
  const user = {
    id: req.body.userId || makeId('trainer-user'),
    role: 'trainer',
    name: req.body.name,
    email,
    phone: req.body.phone,
    passwordHash: hashPassword(req.body.password || 'trainer123'),
    status: 'active',
    trainerId,
    city: req.body.city || req.body.location || '',
    createdAt: new Date().toISOString()
  };

  const newTrainer = {
    id: trainerId,
    userId: user.id,
    name: req.body.name,
    email,
    phoneHidden: true,
    contactPhone: req.body.phone,
    whatsapp: req.body.whatsapp || req.body.phone,
    specialty: req.body.specialty || 'General Fitness',
    bio: req.body.bio || '',
    price: req.body.price || '0',
    rating: 0,
    reviews: 0,
    location: req.body.city || req.body.location || 'Pakistan',
    city: req.body.city || req.body.location || 'Pakistan',
    area: req.body.area || '',
    gender: req.body.gender || '',
    languages: req.body.languages || ['Urdu'],
    serviceModes: req.body.serviceModes || ['Online'],
    experienceLevel: req.body.experienceLevel || 'Intermediate',
    verificationStatus: 'pending',
    profileStatus: 'pending_review',
    verificationLevel: 'Pending admin approval',
    payoutMethod: req.body.payoutMethod || 'Bank Transfer',
    payoutAccount: req.body.payoutAccount || '',
    commissionRate: db.platformSettings.commissionRate,
    capacity: Number(req.body.capacity || 0),
    activeClients: 0,
    completedBookings: 0,
    profileCompleteness: 70,
    responseTimeHours: 0,
    totalRevenue: 0,
    pendingPayout: 0,
    image: req.body.image || '',
    successRate: 'New',
    activeProtocols: 0,
    avgFatLoss: 'N/A',
    clientRetention: 'New',
    goals: req.body.goals || [],
    certifications: req.body.certifications || [],
    transformations: req.body.transformations || []
  };

  db.users.push(user);
  db.trainers.push(newTrainer);
  await writeDB(db);
  res.status(201).json({ trainer: newTrainer, token: createAuthToken(user), user: sanitizeUser(user) });
}));

app.get('/api/trainers/:id/stats', requireAuth, route(async (req, res) => {
  if (!canAccessTrainer(req.currentUser, req.params.id)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const db = await readDB();
  res.json(trainerStats(db, req.params.id));
}));

app.get('/api/trainers/:id/leads', requireAuth, route(async (req, res) => {
  if (!canAccessTrainer(req.currentUser, req.params.id)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const db = await readDB();
  res.json(db.leads.filter((lead) => lead.trainerId === req.params.id));
}));

app.get('/api/leads', requireRole('admin'), route(async (_req, res) => {
  const db = await readDB();
  res.json(db.leads);
}));

app.post('/api/leads', route(async (req, res) => {
  const db = await readDB();
  const newLead = {
    id: makeId('lead'),
    status: 'pending',
    contactUnlocked: false,
    createdAt: new Date().toISOString(),
    clientId: req.currentUser?.role === 'client' ? req.currentUser.id : req.body.clientId,
    clientName: req.currentUser?.role === 'client' ? req.currentUser.name : req.body.clientName,
    clientEmail: req.currentUser?.role === 'client' ? req.currentUser.email : req.body.clientEmail,
    clientPhone: req.currentUser?.role === 'client' ? req.currentUser.phone : req.body.clientPhone,
    ...req.body
  };
  db.leads.push(newLead);
  db.statsEvents.push({ id: makeId('event'), type: 'inquiry', trainerId: req.body.trainerId, createdAt: new Date().toISOString() });
  await writeDB(db);

  const trainer = db.trainers.find((t) => t.id === req.body.trainerId);
  if (trainer?.email) {
    void email.newLead({
      trainerEmail: trainer.email,
      trainerName: trainer.name,
      clientName: newLead.clientName,
      clientGoal: newLead.goal,
      clientMessage: newLead.message,
      leadId: newLead.id
    });
  }

  res.status(201).json(newLead);
}));

app.put('/api/leads/:id', requireAuth, route(async (req, res) => {
  const db = await readDB();
  const index = db.leads.findIndex((lead) => lead.id === req.params.id);
  const patch = typeof req.body === 'string' ? { status: req.body } : req.body || {};
  if (index === -1) return res.status(404).json({ message: 'Lead not found' });
  if (!canAccessTrainer(req.currentUser, db.leads[index].trainerId)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const trainerEditableFields = new Set(['status', 'nutritionTargets', 'nutritionLogs', 'messages']);
  const nextPatch = req.currentUser.role === 'admin'
    ? patch
    : Object.fromEntries(Object.entries(patch).filter(([key]) => trainerEditableFields.has(key)));

  if (req.currentUser.role !== 'admin' && Object.keys(nextPatch).length !== Object.keys(patch).length) {
    return res.status(403).json({ message: 'Only admin can update payment, client, booking or contact-unlock fields.' });
  }

  if (req.currentUser.role !== 'admin' && nextPatch.status === 'booked' && db.leads[index].paymentStatus !== 'verified') {
    return res.status(400).json({ message: 'Admin must verify payment before this lead can be marked booked.' });
  }

  const previousStatus = db.leads[index].status;
  db.leads[index] = { ...db.leads[index], ...nextPatch };
  if (nextPatch.status && nextPatch.status !== previousStatus) {
    db.leads[index].statusHistory = [
      ...(db.leads[index].statusHistory || []),
      {
        status: nextPatch.status,
        timestamp: new Date().toISOString(),
        note: `${req.currentUser.role} updated lead status.`
      }
    ];
  }
  await writeDB(db);
  res.json(db.leads[index]);
}));

app.get('/api/trainers/:id/reviews', route(async (req, res) => {
  const db = await readDB();
  res.json(db.reviews.filter((review) => review.trainerId === req.params.id && review.status !== 'rejected'));
}));

app.post('/api/reviews', requireAuth, route(async (req, res) => {
  const db = await readDB();
  const booking = db.bookings.find((item) => item.id === req.body.bookingId);
  if (!booking || booking.status !== 'completed') {
    return res.status(400).json({ message: 'Only completed bookings can be reviewed' });
  }
  if (req.currentUser.role === 'client' && booking.clientId !== req.currentUser.id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const review = {
    id: makeId('review'),
    bookingId: booking.id,
    trainerId: booking.trainerId,
    clientId: booking.clientId,
    clientName: booking.clientName,
    rating: Number(req.body.rating || 5),
    text: req.body.text || '',
    date: new Date().toISOString().slice(0, 10),
    status: 'pending_moderation',
    verifiedBooking: true
  };
  db.reviews.push(review);
  await writeDB(db);
  res.status(201).json(review);
}));

app.get('/api/trainers/:id/protocols', route(async (req, res) => {
  const db = await readDB();
  res.json(db.protocols.filter((protocol) => protocol.trainerId === req.params.id));
}));

app.post('/api/protocols', requireAuth, route(async (req, res) => {
  const trainerId = req.currentUser.role === 'trainer' ? req.currentUser.trainerId : req.body.trainerId;
  if (!trainerId || !canAccessTrainer(req.currentUser, trainerId)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const db = await readDB();
  const protocol = { id: makeId('protocol'), trainerId, ...req.body };
  db.protocols.push(protocol);
  await writeDB(db);
  res.status(201).json(protocol);
}));

app.delete('/api/protocols/:id', requireAuth, route(async (req, res) => {
  const db = await readDB();
  const protocol = db.protocols.find((item) => item.id === req.params.id);
  if (!protocol) return res.status(404).json({ message: 'Protocol not found' });
  if (!canAccessTrainer(req.currentUser, protocol.trainerId)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  db.protocols = db.protocols.filter((item) => item.id !== req.params.id);
  await writeDB(db);
  res.status(204).end();
}));

app.get('/api/bookings', requireRole('admin'), route(async (_req, res) => {
  const db = await readDB();
  res.json(db.bookings);
}));

app.get('/api/trainer/:id/bookings', requireAuth, route(async (req, res) => {
  if (!canAccessTrainer(req.currentUser, req.params.id)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const db = await readDB();
  res.json(db.bookings.filter((booking) => booking.trainerId === req.params.id));
}));

app.get('/api/trainer/:id/payouts', requireAuth, route(async (req, res) => {
  if (!canAccessTrainer(req.currentUser, req.params.id)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const db = await readDB();
  res.json(db.payouts.filter((payout) => payout.trainerId === req.params.id));
}));

app.get('/api/client/:id/bookings', requireAuth, route(async (req, res) => {
  if (!canAccessClient(req.currentUser, req.params.id)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const db = await readDB();
  res.json(db.bookings.filter((booking) => booking.clientId === req.params.id));
}));

app.get('/api/bookings/:id/messages', requireAuth, route(async (req, res) => {
  const db = await readDB();
  const booking = db.bookings.find((item) => item.id === req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (!canAccessBooking(req.currentUser, booking)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const readAt = new Date().toISOString();
  const bookingIndex = db.bookings.findIndex((item) => item.id === req.params.id);
  if (bookingIndex !== -1) {
    db.bookings[bookingIndex] = {
      ...db.bookings[bookingIndex],
      readState: {
        ...bookingReadState(db.bookings[bookingIndex]),
        [req.currentUser.role]: readAt
      }
    };
    await writeDB(db);
  }

  res.json({
    booking: bookingChatSummary(db.bookings[bookingIndex] || booking, db),
    messages: bookingMessages(db.bookings[bookingIndex] || booking)
  });
}));

app.post('/api/bookings/:id/messages', requireAuth, route(async (req, res) => {
  const db = await readDB();
  const bookingIndex = db.bookings.findIndex((item) => item.id === req.params.id);
  if (bookingIndex === -1) return res.status(404).json({ message: 'Booking not found' });

  const booking = db.bookings[bookingIndex];
  if (!canAccessBooking(req.currentUser, booking)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  if (req.currentUser.role === 'admin') {
    return res.status(403).json({ message: 'Admin can monitor chats but cannot send client-trainer messages.' });
  }
  if (!canChatBooking(booking)) {
    return res.status(403).json({ message: 'Chat unlocks only after admin verifies payment.' });
  }

  const text = String(req.body.text || '').trim();
  const attachments = Array.isArray(req.body.attachments)
    ? req.body.attachments.filter((attachment) => (
      attachment
      && typeof attachment.url === 'string'
      && attachment.url.startsWith('/api/uploads/')
      && typeof attachment.name === 'string'
    )).map((attachment) => ({
      url: attachment.url,
      name: attachment.name,
      type: attachment.type || '',
      size: Number(attachment.size || 0)
    }))
    : [];
  if (!text && attachments.length === 0) return res.status(400).json({ message: 'Message or attachment is required' });
  if (text.length > 2000) return res.status(400).json({ message: 'Message is too long. Keep it under 2000 characters.' });

  const message = {
    id: makeId('message'),
    bookingId: booking.id,
    senderId: req.currentUser.id,
    senderRole: req.currentUser.role,
    senderName: req.currentUser.name,
    text,
    attachments,
    createdAt: new Date().toISOString(),
    adminVisible: true,
    moderationStatus: 'visible'
  };

  db.bookings[bookingIndex] = {
    ...booking,
    messages: [...bookingMessages(booking), message],
    lastMessageAt: message.createdAt,
    readState: {
      ...bookingReadState(booking),
      [req.currentUser.role]: message.createdAt
    }
  };
  await writeDB(db);

  // Notify the other party
  const recipientRole = req.currentUser.role === 'trainer' ? 'client' : 'trainer';
  const recipientId = recipientRole === 'client' ? booking.clientId : db.trainers.find((t) => t.id === booking.trainerId)?.userId;
  const recipient = db.users.find((u) => u.id === recipientId);
  if (recipient?.email) {
    void email.newMessage({
      toEmail: recipient.email,
      recipientName: recipientRole === 'client' ? booking.clientName : booking.trainerName,
      senderName: req.currentUser.name,
      senderRole: req.currentUser.role,
      bookingTitle: booking.packageTitle,
      messagePreview: text.slice(0, 120)
    });
  }

  res.status(201).json({ message, messages: db.bookings[bookingIndex].messages });
}));

app.post('/api/bookings', route(async (req, res) => {
  const db = await readDB();
  const trainer = db.trainers.find((item) => item.id === req.body.trainerId);
  const protocol = db.protocols.find((item) => item.id === req.body.protocolId);
  if (!trainer || !protocol) return res.status(404).json({ message: 'Trainer or package not found' });
  if (!req.body.receiptImage) return res.status(400).json({ message: 'Payment proof upload is required' });

  const grossAmount = parseAmount(req.body.amount || protocol.price);
  const commissionRate = Number(trainer.commissionRate ?? db.platformSettings.commissionRate ?? 0.15);
  const commissionAmount = Math.round(grossAmount * commissionRate);
  const trainerPayoutAmount = grossAmount - commissionAmount;
  const bookingId = makeId('booking');
  const paymentId = makeId('payment');
  const clientId = req.currentUser?.role === 'client' ? req.currentUser.id : req.body.clientId || makeId('guest-client');
  const clientName = req.currentUser?.role === 'client' ? req.currentUser.name : req.body.clientName || 'Guest Client';
  const clientEmail = req.currentUser?.role === 'client' ? req.currentUser.email : req.body.clientEmail || '';
  const clientPhone = req.currentUser?.role === 'client' ? req.currentUser.phone : req.body.clientPhone || '';

  const booking = {
    id: bookingId,
    clientId,
    trainerId: trainer.id,
    protocolId: protocol.id,
    clientName,
    clientEmail,
    clientPhone,
    trainerName: trainer.name,
    packageTitle: protocol.title,
    status: 'pending_verification',
    grossAmount,
    commissionRate,
    commissionAmount,
    trainerPayoutAmount,
    paymentId,
    paymentStatus: 'pending_verification',
    contactUnlocked: false,
    chatStatus: 'locked',
    messages: [],
    createdAt: new Date().toISOString()
  };

  const payment = {
    id: paymentId,
    bookingId,
    method: req.body.paymentMethod || 'Bank Transfer',
    amount: grossAmount,
    receiptImage: req.body.receiptImage,
    status: 'pending_verification',
    createdAt: new Date().toISOString()
  };

  db.bookings.push(booking);
  db.payments.push(payment);
  db.leads.push({
    id: makeId('lead'),
    bookingId,
    trainerId: trainer.id,
    clientId,
    clientName,
    clientEmail,
    clientPhone,
    paymentMethod: payment.method,
    receiptImage: payment.receiptImage,
    goal: protocol.title,
    message: `Paid booking submitted for ${protocol.title}. Contact remains locked until admin verifies payment.`,
    status: 'pending_verification',
    paymentStatus: 'pending_verification',
    contactUnlocked: false,
    createdAt: new Date().toISOString()
  });
  await writeDB(db);
  res.status(201).json({ booking, payment });
}));

app.get('/api/client/:id/progress', requireAuth, route(async (req, res) => {
  if (!canAccessClient(req.currentUser, req.params.id)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const db = await readDB();
  res.json(db.progressEntries?.filter((entry) => entry.clientId === req.params.id) || []);
}));

app.post('/api/client/:id/progress', requireAuth, route(async (req, res) => {
  if (!canAccessClient(req.currentUser, req.params.id)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const db = await readDB();
  const entry = {
    id: makeId('progress'),
    clientId: req.params.id,
    date: req.body.date || new Date().toISOString(),
    weight: Number(req.body.weight || 0),
    notes: sanitizeString(req.body.notes, 500),
    createdAt: new Date().toISOString()
  };
  db.progressEntries = db.progressEntries || [];
  db.progressEntries.push(entry);
  await writeDB(db);
  res.status(201).json(entry);
}));

app.get('/api/admin/chats', requireRole('admin'), route(async (_req, res) => {
  const db = await readDB();
  const chats = db.bookings
    .filter((booking) => canChatBooking(booking) || bookingMessages(booking).length > 0)
    .map((booking) => bookingChatSummary(booking, db))
    .sort((a, b) => new Date(b.latestMessageAt || 0).getTime() - new Date(a.latestMessageAt || 0).getTime());
  res.json(chats);
}));

app.delete('/api/admin/bookings/:id', requireRole('admin'), route(async (req, res) => {
  const db = await readDB();
  const booking = db.bookings.find((item) => item.id === req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  db.bookings = db.bookings.filter((item) => item.id !== req.params.id);
  db.payments = db.payments.filter((payment) => payment.bookingId !== req.params.id);
  db.leads = db.leads.filter((lead) => lead.bookingId !== req.params.id);
  db.payouts = db.payouts.filter((payout) => !Array.isArray(payout.bookingIds) || !payout.bookingIds.includes(req.params.id));
  db.disputes = db.disputes.filter((dispute) => dispute.bookingId !== req.params.id);
  db.reviews = db.reviews.filter((review) => review.bookingId !== req.params.id);
  db.statsEvents = db.statsEvents.filter((event) => event.bookingId !== req.params.id);
  await writeDB(db);
  res.json({ deleted: true, bookingId: req.params.id });
}));

app.get('/api/admin/stats', requireRole('admin'), route(async (_req, res) => {
  const db = await readDB();
  res.json(marketplaceStats(db));
}));

app.get('/api/admin/trainers', requireRole('admin'), route(async (_req, res) => {
  const db = await readDB();
  res.json(db.trainers);
}));

app.patch('/api/admin/trainers/:id/status', requireRole('admin'), route(async (req, res) => {
  const db = await readDB();
  const index = db.trainers.findIndex((trainer) => trainer.id === req.params.id || trainer.userId === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Trainer not found' });
  const verificationStatus = req.body.verificationStatus || db.trainers[index].verificationStatus;
  const approvedCount = db.trainers.filter((t) => t.verificationStatus === 'approved').length;

  let commissionRate = db.trainers[index].commissionRate;
  if (req.body.commissionRate !== undefined) {
    commissionRate = Number(req.body.commissionRate);
  } else if (verificationStatus === 'approved' && db.trainers[index].verificationStatus !== 'approved' && approvedCount < 10) {
    commissionRate = 0.10;
  }

  db.trainers[index] = {
    ...db.trainers[index],
    verificationStatus,
    profileStatus: verificationStatus === 'approved' ? 'live' : verificationStatus === 'rejected' ? 'rejected' : 'pending_review',
    verificationLevel: verificationStatus === 'approved' ? 'CNIC and certification verified' : 'Pending admin approval',
    commissionRate
  };
  await writeDB(db);

  if (verificationStatus === 'approved') {
    const trainerUser = db.users.find((u) => u.trainerId === db.trainers[index].id);
    if (trainerUser?.email) {
      void email.trainerApproved({
        trainerEmail: trainerUser.email,
        trainerName: db.trainers[index].name
      });
    }
  }

  res.json(db.trainers[index]);
}));

app.patch('/api/admin/trainers/:id/commission', requireRole('admin'), route(async (req, res) => {
  const db = await readDB();
  const index = db.trainers.findIndex((trainer) => trainer.id === req.params.id || trainer.userId === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Trainer not found' });
  const rate = Number(req.body.commissionRate);
  if (isNaN(rate) || rate < 0 || rate > 1) {
    return res.status(400).json({ message: 'Commission rate must be between 0 and 1 (e.g., 0.10 for 10%)' });
  }
  db.trainers[index] = { ...db.trainers[index], commissionRate: rate };
  await writeDB(db);
  res.json(db.trainers[index]);
}));

app.post('/api/admin/clean-trainers', requireRole('admin'), route(async (_req, res) => {
  const db = await readDB();
  let cleaned = 0;
  const fakeFields = ['rating', 'reviews', 'completedBookings', 'activeClients', 'successRate', 'avgFatLoss', 'clientRetention', 'totalRevenue', 'activeProtocols'];
  db.trainers = db.trainers.map((trainer) => {
    const hadFake = fakeFields.some((f) => f in trainer);
    if (hadFake) cleaned++;
    const next = { ...trainer };
    for (const f of fakeFields) delete next[f];
    return next;
  });
  await writeDB(db);
  res.json({ message: `Cleaned ${cleaned} trainer profiles. Fake stats removed. Real stats are now computed from bookings and reviews.`, cleaned });
}));

app.get('/api/admin/payments', requireRole('admin'), route(async (_req, res) => {
  const db = await readDB();
  res.json(db.payments);
}));

app.patch('/api/admin/payments/:id/verify', requireRole('admin'), route(async (req, res) => {
  const db = await readDB();
  const paymentIndex = db.payments.findIndex((payment) => payment.id === req.params.id);
  if (paymentIndex === -1) return res.status(404).json({ message: 'Payment not found' });

  const payment = db.payments[paymentIndex];
  const bookingIndex = db.bookings.findIndex((booking) => booking.id === payment.bookingId);
  const leadIndex = db.leads.findIndex((lead) => lead.bookingId === payment.bookingId);
  const status = req.body.status || 'verified';

  db.payments[paymentIndex] = {
    ...payment,
    status,
    verifiedBy: req.currentUser.id,
    verifiedAt: new Date().toISOString()
  };

  if (bookingIndex !== -1) {
    const now = new Date().toISOString();
    const existingMessages = bookingMessages(db.bookings[bookingIndex]);
    const chatOpenedAt = status === 'verified'
      ? (db.bookings[bookingIndex].chatOpenedAt || now)
      : db.bookings[bookingIndex].chatOpenedAt;
    const chatMessages = status === 'verified' && !existingMessages.some((message) => message.type === 'system' && message.event === 'chat_opened')
      ? [
          ...existingMessages,
          {
            id: makeId('message'),
            bookingId: payment.bookingId,
            type: 'system',
            event: 'chat_opened',
            senderRole: 'system',
            senderName: 'Liftrz',
            text: 'Payment verified by admin. Secure client-trainer chat is now open and visible to admin.',
            createdAt: now,
            adminVisible: true
          }
        ]
      : existingMessages;

    db.bookings[bookingIndex] = {
      ...db.bookings[bookingIndex],
      status: status === 'verified' ? 'active' : 'payment_rejected',
      paymentStatus: status,
      contactUnlocked: status === 'verified',
      chatStatus: status === 'verified' ? 'open' : 'locked',
      chatOpenedAt,
      messages: chatMessages,
      verifiedAt: status === 'verified' ? now : undefined
    };

    if (leadIndex !== -1) {
      db.leads[leadIndex] = {
        ...db.leads[leadIndex],
        status: status === 'verified' ? 'booked' : 'payment_rejected',
        paymentStatus: status,
        contactUnlocked: status === 'verified',
        chatStatus: status === 'verified' ? 'open' : 'locked',
        chatOpenedAt
      };
    }

    if (status === 'verified') {
      const booking = db.bookings[bookingIndex];
      const payoutExists = db.payouts.some((payout) => payout.bookingIds?.includes(booking.id));
      if (!payoutExists) {
        db.payouts.push({
          id: makeId('payout'),
          trainerId: booking.trainerId,
          bookingIds: [booking.id],
          amount: booking.trainerPayoutAmount,
          method: db.trainers.find((trainer) => trainer.id === booking.trainerId)?.payoutMethod || 'Bank Transfer',
          status: 'pending',
          reference: ''
        });
      }
    }
  }

  await writeDB(db);

  // Send payment verification emails
  if (status === 'verified' && bookingIndex !== -1) {
    const booking = db.bookings[bookingIndex];
    const trainer = db.trainers.find((t) => t.id === booking.trainerId);

    if (booking.clientEmail) {
      void email.paymentVerified({
        clientEmail: booking.clientEmail,
        clientName: booking.clientName,
        trainerName: booking.trainerName,
        packageTitle: booking.packageTitle
      });
    }

    if (trainer?.email) {
      void email.trainerPaymentVerified({
        trainerEmail: trainer.email,
        trainerName: trainer.name,
        clientName: booking.clientName,
        packageTitle: booking.packageTitle,
        payoutAmount: booking.trainerPayoutAmount
      });
    }
  }

  res.json({ payment: db.payments[paymentIndex], booking: db.bookings[bookingIndex] });
}));

app.get('/api/admin/payouts', requireRole('admin'), route(async (_req, res) => {
  const db = await readDB();
  res.json(db.payouts);
}));

app.patch('/api/admin/payouts/:id', requireRole('admin'), route(async (req, res) => {
  const db = await readDB();
  const index = db.payouts.findIndex((payout) => payout.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Payout not found' });
  const wasPaid = db.payouts[index].status === 'paid';
  const nowPaid = req.body.status === 'paid';
  db.payouts[index] = {
    ...db.payouts[index],
    status: req.body.status || db.payouts[index].status,
    reference: req.body.reference ?? db.payouts[index].reference,
    receiptImage: req.body.receiptImage ?? db.payouts[index].receiptImage,
    paidAt: nowPaid && !wasPaid ? new Date().toISOString() : db.payouts[index].paidAt
  };
  await writeDB(db);

  if (nowPaid && !wasPaid) {
    const payout = db.payouts[index];
    const trainer = db.trainers.find((t) => t.id === payout.trainerId);
    const trainerUser = db.users.find((u) => u.trainerId === payout.trainerId);
    if (trainerUser?.email) {
      void email.trainerPayoutPaid({
        trainerEmail: trainerUser.email,
        trainerName: trainer?.name || trainerUser.name,
        amount: payout.amount,
        method: payout.method,
        reference: payout.reference,
        receiptImage: payout.receiptImage
      });
    }
  }

  res.json(db.payouts[index]);
}));

app.get('/api/admin/disputes', requireRole('admin'), route(async (_req, res) => {
  const db = await readDB();
  res.json(db.disputes);
}));

app.patch('/api/admin/disputes/:id', requireRole('admin'), route(async (req, res) => {
  const db = await readDB();
  const index = db.disputes.findIndex((dispute) => dispute.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Dispute not found' });
  db.disputes[index] = { ...db.disputes[index], ...req.body };
  await writeDB(db);
  res.json(db.disputes[index]);
}));

app.get('/api/health/storage', route(async (_req, res) => {
  const db = await readDB();
  res.json({
    ok: true,
    store: supabaseStore ? 'supabase' : 'sqlite',
    storage: Boolean(supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY),
    trainers: db.trainers.length,
    payments: db.payments.length
  });
}));

app.post('/api/uploads', route(async (req, res) => {
  const upload = await uploadObject({
    bucket: req.body.bucket || 'Liftrz-private',
    folder: req.body.folder || 'receipts',
    fileName: req.body.fileName,
    dataUrl: req.body.dataUrl
  });
  res.status(201).json(upload);
}));

app.get('/api/uploads/:bucket/*', route(async (req, res) => {
  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ message: 'Supabase storage is not configured' });
  }

  const objectPath = req.params[0];
  const objectUrl = `${supabaseUrl}/storage/v1/object/${req.params.bucket}/${objectPath}`;
  const response = await fetch(objectUrl, {
    headers: storageHeaders()
  });

  if (!response.ok) {
    return res.status(response.status).json({ message: 'Upload not found' });
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const buffer = Buffer.from(await response.arrayBuffer());
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'private, no-store');
  res.send(buffer);
}));

app.use((error, _req, res, _next) => {
  console.error(error);
  const message = error instanceof Error ? error.message : 'Server error';
  res.status(500).json({ message });
});

if (!isServerless) {
  app.listen(PORT, () => {
    console.log(`Liftrz marketplace API running on http://localhost:${PORT}`);
  });
}

export default app;
