import express from 'express';
import fs from 'fs';
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
const canonicalHost = (process.env.CANONICAL_HOST || 'liftrz.com').toLowerCase();
const productionHosts = new Set([canonicalHost, `www.${canonicalHost}`]);
app.set('trust proxy', 1);

app.use((req, res, next) => {
  const host = String(req.headers.host || '').split(':')[0].toLowerCase();
  if (host === `www.${canonicalHost}`) {
    return res.redirect(301, `https://${canonicalHost}${req.originalUrl}`);
  }
  return next();
});

app.use((req, res, next) => {
  const host = String(req.headers.host || '').split(':')[0].toLowerCase();
  if (productionHosts.has(host)) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
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

const containsOffPlatformContact = (value = '') => {
  const text = String(value).toLowerCase();
  const compact = text.replace(/[\s()._\-]/g, '');
  const phoneRegexes = [
    /(?:\+?92|0092)3\d{9}/,
    /03\d{9}/,
    /\b3\d{9}\b/
  ];
  const urlRegex = /\b(?:https?:\/\/|www\.|wa\.me\/|whatsapp\.com\/|t\.me\/|telegram\.me\/|instagram\.com\/|facebook\.com\/|fb\.com\/)[^\s]+/i;
  return urlRegex.test(text) || phoneRegexes.some((regex) => regex.test(compact));
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
const normalizeProtocolPayload = (body = {}) => {
  const featureSource = Array.isArray(body.features) ? body.features : String(body.features || '').split('\n');
  return {
    title: sanitizeString(body.title, 120),
    description: sanitizeString(body.description, 1500),
    duration: sanitizeString(body.duration, 80),
    price: sanitizeString(String(body.price ?? ''), 30),
    features: featureSource.map((item) => sanitizeString(item, 160)).filter(Boolean).slice(0, 20)
  };
};
const validateProtocolPayload = (payload) => {
  if (!payload.title) return 'Package title is required';
  if (!payload.duration) return 'Package duration is required';
  if (!payload.price || parseAmount(payload.price) <= 0) return 'Package price must be greater than 0';
  if (!payload.description) return 'Package description is required';
  if (!payload.features.length) return 'At least one package feature is required';
  return '';
};
const hasApprovedProtocol = (protocol) => protocol.status === 'approved' || !protocol.status;
const hasPendingProtocolWork = (protocol) => protocol.status === 'pending_review' || protocol.editStatus === 'pending_review';
const syncTrainerPackageStatus = (db, trainerId) => {
  const trainerIndex = db.trainers.findIndex((trainer) => trainer.id === trainerId);
  if (trainerIndex === -1) return;
  const trainerProtocols = db.protocols.filter((protocol) => protocol.trainerId === trainerId);
  if (trainerProtocols.some(hasApprovedProtocol)) {
    db.trainers[trainerIndex].packagesStatus = 'approved';
  } else if (trainerProtocols.some(hasPendingProtocolWork)) {
    db.trainers[trainerIndex].packagesStatus = 'pending_review';
  } else if (trainerProtocols.some((protocol) => protocol.status === 'rejected' || protocol.editStatus === 'rejected')) {
    db.trainers[trainerIndex].packagesStatus = 'rejected';
  } else {
    db.trainers[trainerIndex].packagesStatus = 'not_submitted';
  }
};
const publicProtocol = (protocol) => {
  const {
    pendingUpdate,
    editStatus,
    editSubmittedAt,
    editReviewNote,
    reviewNote,
    ...safe
  } = protocol;
  return safe;
};
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
  const existingDetails = await existing.text().catch(() => '');
  const bucketMissing = existing.status === 404 || /bucket not found/i.test(existingDetails);
  if (!bucketMissing) {
    throw new Error(`Storage bucket check failed: ${existingDetails || existing.statusText}`);
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
const findTrainerByIdOrSlug = (db, lookupId) => db.trainers.find((trainer) => trainer.id === lookupId || trainer.slug === lookupId);
const isPublicTrainerProfile = (trainer) => trainer.verificationStatus === 'approved' && trainer.profileStatus !== 'rejected';
const isFeaturedTrainer = (trainer) => {
  const stillActive = !trainer.featuredUntil || new Date(trainer.featuredUntil).getTime() >= Date.now();
  const paidApproved = trainer.featuredStatus === 'approved' && trainer.featuredPaymentStatus === 'verified';
  return stillActive && (trainer.featuredManual === true || paidApproved);
};

const withReview = (item, status = 'pending_review', note = '') => ({
  ...(item || {}),
  status,
  reviewNote: note,
  reviewedAt: new Date().toISOString()
});

const canChatBooking = (booking) => (
  booking?.paymentStatus === 'verified'
  && booking?.contactUnlocked === true
  && !['payment_rejected', 'cancelled'].includes(booking?.status)
);

const bookingMessages = (booking) => Array.isArray(booking?.messages) ? booking.messages : [];

const chatMessagesForUser = (booking, user) => bookingMessages(booking).map((message) => {
  if (user?.role === 'admin' || message.moderationStatus !== 'hidden') return message;
  return {
    ...message,
    text: 'Message hidden by admin.',
    attachments: [],
    hiddenFromUser: true
  };
});

const bookingForUser = (booking, user) => ({
  ...booking,
  messages: chatMessagesForUser(booking, user)
});

const bookingReadState = (booking) => (booking?.readState && typeof booking.readState === 'object' ? booking.readState : {});

const bookingChatSummary = (booking, db, user) => {
  const messages = user ? chatMessagesForUser(booking, user) : bookingMessages(booking);
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
  const {
    contactPhone,
    whatsapp,
    payoutAccount,
    bankName,
    bankAccountNumber,
    accountTitle,
    cnicNumber,
    cnicFrontImage,
    cnicBackImage,
    certificationDocs,
    rating: _fakeRating,
    reviews: _fakeReviews,
    completedBookings: _fakeCompleted,
    successRate: _fakeSuccess,
    avgFatLoss: _fakeFatLoss,
    clientRetention: _fakeRetention,
    totalRevenue: _fakeRevenue,
    ...safe
  } = trainer;
  const stats = db ? trainerStats(db, trainer.id) : {};
  const approvedProtocols = db
    ? db.protocols.filter((protocol) => protocol.trainerId === trainer.id && (protocol.status === 'approved' || !protocol.status))
    : [];
  const packagePrices = approvedProtocols
    .map((protocol) => parseAmount(protocol.price))
    .filter((price) => price > 0);
  const lowestPackagePrice = packagePrices.length ? Math.min(...packagePrices) : 0;
  const lowestPackage = approvedProtocols
    .filter((protocol) => parseAmount(protocol.price) > 0)
    .sort((a, b) => parseAmount(a.price) - parseAmount(b.price))[0];
  return {
    ...safe,
    certifications: Array.isArray(trainer.certifications)
      ? trainer.certifications.filter((item) => typeof item === 'string')
      : [],
    transformations: Array.isArray(trainer.transformations)
      ? trainer.transformations.filter((item) => item.status === 'approved' || !item.status)
      : [],
    profileGallery: Array.isArray(trainer.profileGallery)
      ? trainer.profileGallery.filter((item) => item.status === 'approved' || !item.status).slice(0, 5)
      : [],
    transformationImages: Array.isArray(trainer.transformationImages)
      ? trainer.transformationImages.filter((item) => item.status === 'approved' || !item.status).slice(0, 10)
      : [],
    rating: stats.averageRating || 0,
    reviews: stats.reviewCount || 0,
    completedBookings: stats.completedClients || 0,
    activeClients: stats.activeClients || 0,
    lowestPackagePrice,
    lowestPackageDuration: lowestPackage?.duration || '',
    startingPrice: lowestPackagePrice || parseAmount(trainer.price),
    approvedPackageCount: approvedProtocols.length,
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
    pendingFeaturedApprovals: db.trainers.filter((trainer) => trainer.featuredStatus === 'requested').length,
    openDisputes: db.disputes.filter((dispute) => dispute.status === 'open').length
  };
};

app.get('/api/settings', route(async (_req, res) => {
  const db = await readDB();
  res.json(db.platformSettings);
}));

app.post('/api/contact', validateBody({
  name: { required: true, maxLength: 120 },
  email: { required: true, maxLength: 200, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  subject: { required: true, maxLength: 160 },
  message: { required: true, maxLength: 2000 }
}), route(async (req, res) => {
  const db = await readDB();
  db.contactMessages = db.contactMessages || [];
  const contactMessage = {
    id: makeId('contact'),
    name: sanitizeString(req.body.name, 120),
    email: sanitizeString(req.body.email, 200),
    subject: sanitizeString(req.body.subject, 160),
    message: sanitizeString(req.body.message, 2000),
    status: 'new',
    createdAt: new Date().toISOString()
  };
  db.contactMessages.push(contactMessage);
  await writeDB(db);
  void email.contactMessage({
    name: contactMessage.name,
    fromEmail: contactMessage.email,
    subject: contactMessage.subject,
    message: contactMessage.message
  });
  res.status(201).json(contactMessage);
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
    .filter((trainer) => includePending || isPublicTrainerProfile(trainer))
    .map((trainer) => ({ trainer, stats: trainerStats(db, trainer.id) }))
    .sort((a, b) => {
      const scoreA = (isFeaturedTrainer(a.trainer) ? 1000 : 0) + Number(a.stats.completedClients || 0) * 2 + Number(a.stats.averageRating || 0) * 10 + Number(a.trainer.profileCompleteness || 0);
      const scoreB = (isFeaturedTrainer(b.trainer) ? 1000 : 0) + Number(b.stats.completedClients || 0) * 2 + Number(b.stats.averageRating || 0) * 10 + Number(b.trainer.profileCompleteness || 0);
      return scoreB - scoreA;
    })
    .map(({ trainer }) => publicTrainer(trainer, db));
  res.json(trainers);
}));

app.get('/api/featured-trainers', route(async (_req, res) => {
  const db = await readDB();
  const trainers = db.trainers
    .filter(isPublicTrainerProfile)
    .filter(isFeaturedTrainer)
    .sort((a, b) => new Date(b.featuredApprovedAt || b.updatedAt || 0).getTime() - new Date(a.featuredApprovedAt || a.updatedAt || 0).getTime())
    .slice(0, 6)
    .map((trainer) => publicTrainer(trainer, db));
  res.json(trainers);
}));

app.get('/api/trainers/:id', route(async (req, res) => {
  const db = await readDB();
  const lookupId = req.params.id;
  const trainer = db.trainers.find((item) => item.id === lookupId || item.slug === lookupId);
  if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
  if (canAccessTrainer(req.currentUser, trainer.id)) {
    return res.json({
      ...trainer,
      ...trainerStats(db, trainer.id)
    });
  }
  res.json(publicTrainer(trainer, db));
}));

app.post('/api/trainers', route(async (req, res) => {
  const db = await readDB();
  const email = req.body.email?.toLowerCase()?.trim();
  const emailTaken = db.users.some((user) => user.email?.toLowerCase() === email);
  if (emailTaken) return res.status(409).json({ message: 'Email already registered' });

  const trainerId = req.body.id || makeId('trainer');
  const trainerSlug = (req.body.name || 'trainer')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + (req.body.city || req.body.location || 'pakistan')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

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
    slug: trainerSlug,
    userId: user.id,
    name: req.body.name,
    email,
    phoneHidden: true,
    contactPhone: req.body.phone,
    whatsapp: req.body.whatsapp || req.body.phone,
    specialty: req.body.specialty || 'General Fitness',
    headline: sanitizeString(req.body.headline, 80) || 'Personal Trainer',
    bio: req.body.bio || '',
    price: req.body.price || '0',
    rating: 0,
    reviews: 0,
    location: req.body.city || req.body.location || 'Pakistan',
    city: req.body.city || req.body.location || 'Pakistan',
    area: req.body.area || '',
    gender: req.body.gender || '',
    clientGenders: Array.isArray(req.body.clientGenders) ? req.body.clientGenders : ['Male', 'Female'],
    clientAgeMin: sanitizeString(req.body.clientAgeMin, 3),
    clientAgeMax: sanitizeString(req.body.clientAgeMax, 3),
    languages: req.body.languages || ['Urdu'],
    serviceModes: req.body.serviceModes || ['Online'],
    experienceLevel: req.body.experienceLevel || 'Intermediate',
    verificationStatus: 'pending',
    profileStatus: 'pending_review',
    verificationLevel: 'Pending admin approval',
    identityStatus: 'not_submitted',
    profileAssetsStatus: 'not_submitted',
    payoutStatus: 'not_submitted',
    certificationsStatus: 'not_submitted',
    packagesStatus: 'not_submitted',
    identitySubmittedAt: '',
    profileAssetsSubmittedAt: '',
    payoutSubmittedAt: '',
    certificationsSubmittedAt: '',
    payoutMethod: req.body.payoutMethod || 'Bank Transfer',
    payoutAccount: req.body.payoutAccount || '',
    bankName: '',
    bankAccountNumber: '',
    accountTitle: '',
    cnicNumber: '',
    cnicFrontImage: '',
    cnicBackImage: '',
    certificationDocs: [],
    commissionRate: db.platformSettings.commissionRate,
    featuredStatus: 'none',
    featuredPaymentStatus: 'not_required',
    featuredManual: false,
    featuredPlacement: 'home',
    featuredNote: '',
    featuredRequestedAt: '',
    featuredApprovedAt: '',
    featuredRejectedAt: '',
    featuredUntil: '',
    featuredReceiptImage: '',
    capacity: Number(req.body.capacity || 0),
    availableDays: [],
    availableTimeSlots: '',
    homeVisitAreas: '',
    availabilityNote: '',
    activeClients: 0,
    completedBookings: 0,
    profileCompleteness: 70,
    responseTimeHours: 0,
    totalRevenue: 0,
    pendingPayout: 0,
    image: req.body.image || '',
    profileGallery: [],
    transformationImages: [],
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

app.patch('/api/trainers/:id/profile', requireAuth, route(async (req, res) => {
  if (!canAccessTrainer(req.currentUser, req.params.id)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const db = await readDB();
  const index = db.trainers.findIndex((trainer) => trainer.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Trainer not found' });

  const now = new Date().toISOString();
  const allowed = new Set([
    'name', 'phone', 'contactPhone', 'whatsapp', 'email', 'city', 'location', 'area', 'gender',
    'headline', 'clientGenders', 'clientAgeMin', 'clientAgeMax',
    'languages', 'specialty', 'goals', 'serviceModes', 'bio', 'price', 'capacity', 'image',
    'availableDays', 'availableTimeSlots', 'homeVisitAreas', 'availabilityNote',
    'cnicNumber', 'cnicFrontImage', 'cnicBackImage',
    'bankName', 'bankAccountNumber', 'accountTitle', 'payoutMethod', 'payoutAccount',
    'certifications', 'certificationDocs', 'transformations', 'profileGallery', 'transformationImages'
  ]);
  const patch = {};
  Object.entries(req.body || {}).forEach(([key, value]) => {
    if (allowed.has(key)) patch[key] = value;
  });

  const statusPatch = {};
  if ('cnicNumber' in patch || 'cnicFrontImage' in patch || 'cnicBackImage' in patch) {
    statusPatch.identityStatus = 'pending_review';
    statusPatch.identitySubmittedAt = now;
  }
  if ('image' in patch || 'bio' in patch || 'profileGallery' in patch || 'transformationImages' in patch || 'transformations' in patch) {
    statusPatch.profileAssetsStatus = 'pending_review';
    statusPatch.profileAssetsSubmittedAt = now;
  }
  if ('bankName' in patch || 'bankAccountNumber' in patch || 'accountTitle' in patch || 'payoutMethod' in patch || 'payoutAccount' in patch) {
    statusPatch.payoutStatus = 'pending_review';
    statusPatch.payoutSubmittedAt = now;
  }
  if ('certifications' in patch || 'certificationDocs' in patch) {
    statusPatch.certificationsStatus = 'pending_review';
    statusPatch.certificationsSubmittedAt = now;
  }

  db.trainers[index] = {
    ...db.trainers[index],
    ...patch,
    ...statusPatch,
    updatedAt: now
  };
  await writeDB(db);
  res.json(db.trainers[index]);
}));

app.post('/api/trainers/:id/featured-request', requireAuth, route(async (req, res) => {
  if (!canAccessTrainer(req.currentUser, req.params.id)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const db = await readDB();
  const index = db.trainers.findIndex((trainer) => trainer.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Trainer not found' });
  if (db.trainers[index].verificationStatus !== 'approved' || db.trainers[index].profileStatus !== 'live') {
    return res.status(400).json({ message: 'Your profile must be approved before requesting a featured placement.' });
  }

  const placement = ['home', 'discover', 'all'].includes(req.body.featuredPlacement) ? req.body.featuredPlacement : 'home';
  db.trainers[index] = {
    ...db.trainers[index],
    featuredStatus: 'requested',
    featuredPaymentStatus: 'pending',
    featuredManual: false,
    featuredPlacement: placement,
    featuredNote: sanitizeString(req.body.featuredNote, 500),
    featuredReceiptImage: sanitizeString(req.body.featuredReceiptImage, 2000),
    featuredRequestedAt: new Date().toISOString(),
    featuredRejectedAt: ''
  };
  await writeDB(db);
  res.json(db.trainers[index]);
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

app.post('/api/match-requests', route(async (req, res) => {
  const db = await readDB();
  const createdAt = new Date().toISOString();
  const matchRequest = {
    id: makeId('match'),
    type: 'manual_match',
    status: 'new',
    trainerId: 'manual-match',
    contactUnlocked: false,
    createdAt,
    clientId: req.currentUser?.role === 'client' ? req.currentUser.id : req.body.clientId,
    clientName: req.currentUser?.role === 'client' ? req.currentUser.name : sanitizeString(req.body.clientName, 120),
    clientEmail: req.currentUser?.role === 'client' ? req.currentUser.email : sanitizeString(req.body.clientEmail, 160),
    clientPhone: req.currentUser?.role === 'client' ? req.currentUser.phone : sanitizeString(req.body.clientPhone, 40),
    city: sanitizeString(req.body.city, 80),
    goal: sanitizeString(req.body.goal, 120),
    budget: sanitizeString(req.body.budget, 80),
    mode: sanitizeString(req.body.mode, 80),
    genderPreference: sanitizeString(req.body.genderPreference, 80),
    message: sanitizeString(req.body.message, 800),
    source: sanitizeString(req.body.source, 80) || 'manual_match'
  };

  db.leads.push(matchRequest);
  db.statsEvents.push({
    id: makeId('event'),
    type: 'manual_match_request',
    city: matchRequest.city,
    goal: matchRequest.goal,
    source: matchRequest.source,
    createdAt
  });
  await writeDB(db);
  res.status(201).json(matchRequest);
}));

app.post('/api/events', route(async (req, res) => {
  const db = await readDB();
  const event = {
    id: makeId('event'),
    type: sanitizeString(req.body.type, 80) || 'event',
    trainerId: sanitizeString(req.body.trainerId, 120) || undefined,
    city: sanitizeString(req.body.city, 80) || undefined,
    goal: sanitizeString(req.body.goal, 120) || undefined,
    source: sanitizeString(req.body.source, 120) || undefined,
    path: sanitizeString(req.body.path, 240) || undefined,
    metadata: req.body.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : undefined,
    createdAt: new Date().toISOString()
  };
  db.statsEvents.push(event);
  await writeDB(db);
  res.status(201).json({ ok: true });
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
  const trainer = findTrainerByIdOrSlug(db, req.params.id);
  if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
  res.json(db.reviews.filter((review) => review.trainerId === trainer.id && review.status !== 'rejected'));
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
  const trainer = findTrainerByIdOrSlug(db, req.params.id);
  if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
  const canSeeDrafts = canAccessTrainer(req.currentUser, trainer.id);
  const protocols = db.protocols.filter((protocol) => protocol.trainerId === trainer.id && (canSeeDrafts || protocol.status === 'approved' || !protocol.status));
  res.json(canSeeDrafts ? protocols : protocols.map(publicProtocol));
}));

app.post('/api/protocols', requireAuth, route(async (req, res) => {
  const trainerId = req.currentUser.role === 'trainer' ? req.currentUser.trainerId : req.body.trainerId;
  if (!trainerId || !canAccessTrainer(req.currentUser, trainerId)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const db = await readDB();
  const payload = normalizeProtocolPayload(req.body);
  const validationError = validateProtocolPayload(payload);
  if (validationError) return res.status(400).json({ message: validationError });

  const protocol = {
    id: makeId('protocol'),
    trainerId,
    ...payload,
    status: 'pending_review',
    submittedAt: new Date().toISOString()
  };
  db.protocols.push(protocol);
  syncTrainerPackageStatus(db, trainerId);
  await writeDB(db);
  res.status(201).json(protocol);
}));

app.patch('/api/protocols/:id', requireAuth, route(async (req, res) => {
  const db = await readDB();
  const index = db.protocols.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Package not found' });
  if (!canAccessTrainer(req.currentUser, db.protocols[index].trainerId)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const payload = normalizeProtocolPayload(req.body);
  const validationError = validateProtocolPayload(payload);
  if (validationError) return res.status(400).json({ message: validationError });

  const now = new Date().toISOString();
  const approvedPackage = hasApprovedProtocol(db.protocols[index]);
  if (approvedPackage) {
    db.protocols[index] = {
      ...db.protocols[index],
      pendingUpdate: {
        ...payload,
        submittedAt: now
      },
      editStatus: 'pending_review',
      editSubmittedAt: now,
      editReviewNote: '',
      updatedAt: now
    };
  } else {
    db.protocols[index] = {
      ...db.protocols[index],
      ...payload,
      status: 'pending_review',
      reviewNote: '',
      submittedAt: now,
      updatedAt: now
    };
  }

  syncTrainerPackageStatus(db, db.protocols[index].trainerId);
  await writeDB(db);
  res.json(db.protocols[index]);
}));

app.delete('/api/protocols/:id', requireAuth, route(async (req, res) => {
  const db = await readDB();
  const protocol = db.protocols.find((item) => item.id === req.params.id);
  if (!protocol) return res.status(404).json({ message: 'Protocol not found' });
  if (!canAccessTrainer(req.currentUser, protocol.trainerId)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  db.protocols = db.protocols.filter((item) => item.id !== req.params.id);
  syncTrainerPackageStatus(db, protocol.trainerId);
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
  res.json(db.bookings.filter((booking) => booking.trainerId === req.params.id).map((booking) => bookingForUser(booking, req.currentUser)));
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
  res.json(db.bookings.filter((booking) => booking.clientId === req.params.id).map((booking) => bookingForUser(booking, req.currentUser)));
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
    booking: bookingChatSummary(db.bookings[bookingIndex] || booking, db, req.currentUser),
    messages: chatMessagesForUser(db.bookings[bookingIndex] || booking, req.currentUser)
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
  if (containsOffPlatformContact(text)) {
    return res.status(400).json({ message: 'Liftrz policy: do not share phone numbers or external links in chat.' });
  }
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

  res.status(201).json({ message, messages: chatMessagesForUser(db.bookings[bookingIndex], req.currentUser) });
}));

app.post('/api/bookings', route(async (req, res) => {
  const db = await readDB();
  const trainer = db.trainers.find((item) => item.id === req.body.trainerId);
  const protocol = db.protocols.find((item) => item.id === req.body.protocolId);
  if (!trainer || !protocol) return res.status(404).json({ message: 'Trainer or package not found' });
  const transactionId = sanitizeString(req.body.transactionId, 160);
  if (!req.body.receiptImage && !transactionId) {
    return res.status(400).json({ message: 'Upload a payment screenshot or enter a transaction ID' });
  }

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
    receiptImage: req.body.receiptImage || '',
    transactionId,
    accountName: sanitizeString(req.body.accountName || 'ibrahim shakeel', 120),
    accountNumber: sanitizeString(req.body.accountNumber || '03214026075', 80),
    bankName: sanitizeString(req.body.bankName || 'nayapay', 120),
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
    transactionId: payment.transactionId,
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

app.patch('/api/admin/bookings/:bookingId/messages/:messageId', requireRole('admin'), route(async (req, res) => {
  const db = await readDB();
  const bookingIndex = db.bookings.findIndex((booking) => booking.id === req.params.bookingId);
  if (bookingIndex === -1) return res.status(404).json({ message: 'Booking not found' });

  const messages = bookingMessages(db.bookings[bookingIndex]);
  const messageIndex = messages.findIndex((message) => message.id === req.params.messageId);
  if (messageIndex === -1) return res.status(404).json({ message: 'Message not found' });

  const moderationStatus = req.body.moderationStatus === 'visible' ? 'visible' : 'hidden';
  const nextMessages = messages.map((message, index) => index === messageIndex
    ? {
        ...message,
        moderationStatus,
        moderationReason: moderationStatus === 'hidden' ? sanitizeString(req.body.moderationReason, 500) : '',
        moderatedAt: new Date().toISOString(),
        moderatedBy: req.currentUser.id
      }
    : message);

  db.bookings[bookingIndex] = {
    ...db.bookings[bookingIndex],
    messages: nextMessages
  };
  await writeDB(db);
  res.json({
    booking: bookingChatSummary(db.bookings[bookingIndex], db, req.currentUser),
    messages: chatMessagesForUser(db.bookings[bookingIndex], req.currentUser)
  });
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

app.get('/api/admin/notifications', requireRole('admin'), route(async (_req, res) => {
  const db = await readDB();
  const notifications = [
    ...(db.contactMessages || []).filter((item) => item.status !== 'closed').map((item) => ({
      id: item.id,
      type: 'contact',
      title: `Contact: ${item.subject}`,
      detail: `${item.name} / ${item.email}`,
      createdAt: item.createdAt,
      href: '/admin'
    })),
    ...db.trainers.filter((trainer) => trainer.verificationStatus === 'pending').map((trainer) => ({
      id: `trainer-${trainer.id}`,
      type: 'trainer_signup',
      title: 'New trainer signup',
      detail: `${trainer.name} / ${trainer.city}`,
      createdAt: trainer.createdAt,
      href: '/admin'
    })),
    ...db.trainers.flatMap((trainer) => ['identityStatus', 'profileAssetsStatus', 'payoutStatus', 'certificationsStatus'].filter((key) => trainer[key] === 'pending_review').map((key) => ({
      id: `${trainer.id}-${key}`,
      type: 'trainer_review',
      title: `${key.replace('Status', '')} pending`,
      detail: trainer.name,
      createdAt: trainer.updatedAt || trainer.createdAt,
      href: '/admin'
    }))),
    ...db.protocols.filter((protocol) => protocol.status === 'pending_review').map((protocol) => ({
      id: `protocol-${protocol.id}`,
      type: 'package',
      title: 'Package pending approval',
      detail: protocol.title,
      createdAt: protocol.submittedAt,
      href: '/admin'
    })),
    ...db.payments.filter((payment) => payment.status === 'pending_verification').map((payment) => ({
      id: `payment-${payment.id}`,
      type: 'payment',
      title: 'Payment pending verification',
      detail: `PKR ${Number(payment.amount || 0).toLocaleString()}`,
      createdAt: payment.createdAt,
      href: '/admin'
    })),
    ...db.trainers.filter((trainer) => trainer.featuredStatus === 'requested').map((trainer) => ({
      id: `featured-${trainer.id}`,
      type: 'featured',
      title: 'Featured request pending',
      detail: trainer.name,
      createdAt: trainer.featuredRequestedAt,
      href: '/admin'
    }))
  ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  res.json(notifications);
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

app.patch('/api/admin/trainers/:id/profile-review', requireRole('admin'), route(async (req, res) => {
  const db = await readDB();
  const index = db.trainers.findIndex((trainer) => trainer.id === req.params.id || trainer.userId === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Trainer not found' });
  const allowedStatuses = ['not_submitted', 'pending_review', 'approved', 'rejected'];
  const patch = {};
  ['identityStatus', 'profileAssetsStatus', 'payoutStatus', 'certificationsStatus', 'packagesStatus'].forEach((key) => {
    if (allowedStatuses.includes(req.body[key])) patch[key] = req.body[key];
  });
  const reviewNote = sanitizeString(req.body.reviewNote, 500);

  if (req.body.profileAssetsStatus === 'approved') {
    patch.profileGallery = (db.trainers[index].profileGallery || []).map((item) => withReview(item, item.status === 'rejected' ? 'rejected' : 'approved', item.reviewNote || ''));
    patch.transformationImages = (db.trainers[index].transformationImages || []).map((item) => withReview(item, item.status === 'rejected' ? 'rejected' : 'approved', item.reviewNote || ''));
  }
  if (req.body.certificationsStatus === 'approved') {
    patch.certificationDocs = (db.trainers[index].certificationDocs || []).map((item) => withReview(item, item.status === 'rejected' ? 'rejected' : 'approved', item.reviewNote || ''));
  }

  if (req.body.mediaType && Number.isInteger(Number(req.body.index))) {
    const mediaType = ['profileGallery', 'transformationImages', 'certificationDocs'].includes(req.body.mediaType) ? req.body.mediaType : '';
    const status = allowedStatuses.includes(req.body.status) ? req.body.status : '';
    const itemIndex = Number(req.body.index);
    if (!mediaType || !status) return res.status(400).json({ message: 'Invalid media review request' });
    const items = Array.isArray(db.trainers[index][mediaType]) ? [...db.trainers[index][mediaType]] : [];
    if (!items[itemIndex]) return res.status(404).json({ message: 'Media item not found' });
    items[itemIndex] = withReview(items[itemIndex], status, reviewNote);
    patch[mediaType] = items;

    if (mediaType === 'profileGallery' || mediaType === 'transformationImages') {
      patch.profileAssetsStatus = items.some((item) => item.status === 'pending_review') ? 'pending_review' : 'approved';
    }
    if (mediaType === 'certificationDocs') {
      patch.certificationsStatus = items.some((item) => item.status === 'pending_review') ? 'pending_review' : status;
    }
  }

  const allCoreApproved = ['identityStatus', 'profileAssetsStatus', 'payoutStatus', 'certificationsStatus', 'packagesStatus']
    .every((key) => (patch[key] || db.trainers[index][key]) === 'approved');
  db.trainers[index] = {
    ...db.trainers[index],
    ...patch,
    verificationStatus: allCoreApproved ? 'approved' : db.trainers[index].verificationStatus,
    profileStatus: allCoreApproved ? 'live' : db.trainers[index].profileStatus,
    verificationLevel: allCoreApproved ? 'CNIC, profile, payout, packages and certifications verified' : db.trainers[index].verificationLevel,
    reviewNote: reviewNote || db.trainers[index].reviewNote,
    reviewMessages: req.body.reviewNote
      ? [
          ...(db.trainers[index].reviewMessages || []),
          {
            id: makeId('review-note'),
            section: req.body.mediaType || Object.keys(patch).find((key) => key.endsWith('Status')) || 'profile',
            status: req.body.status || Object.values(patch).find((value) => allowedStatuses.includes(value)) || '',
            note: reviewNote,
            createdAt: new Date().toISOString()
          }
        ]
      : db.trainers[index].reviewMessages || [],
    updatedAt: new Date().toISOString()
  };
  await writeDB(db);
  res.json(db.trainers[index]);
}));

app.get('/api/admin/protocols', requireRole('admin'), route(async (_req, res) => {
  const db = await readDB();
  res.json(db.protocols.map((protocol) => ({
    ...protocol,
    trainer: db.trainers.find((trainer) => trainer.id === protocol.trainerId)
  })));
}));

app.patch('/api/admin/protocols/:id', requireRole('admin'), route(async (req, res) => {
  const db = await readDB();
  const index = db.protocols.findIndex((protocol) => protocol.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Package not found' });
  const status = ['pending_review', 'approved', 'rejected'].includes(req.body.status) ? req.body.status : db.protocols[index].status;
  const reviewNote = sanitizeString(req.body.reviewNote ?? '', 500);
  const now = new Date().toISOString();
  const pendingEdit = db.protocols[index].editStatus === 'pending_review' && db.protocols[index].pendingUpdate;

  if (pendingEdit) {
    if (status === 'approved') {
      const {
        pendingUpdate,
        editStatus,
        editSubmittedAt,
        editReviewNote,
        ...currentProtocol
      } = db.protocols[index];
      db.protocols[index] = {
        ...currentProtocol,
        ...pendingUpdate,
        status: currentProtocol.status || 'approved',
        reviewNote: reviewNote || currentProtocol.reviewNote || '',
        reviewedAt: now,
        updatedAt: now
      };
    } else if (status === 'rejected') {
      const {
        pendingUpdate,
        editSubmittedAt,
        ...currentProtocol
      } = db.protocols[index];
      db.protocols[index] = {
        ...currentProtocol,
        editStatus: 'rejected',
        editReviewNote: reviewNote,
        reviewedAt: now,
        updatedAt: now
      };
    } else {
      db.protocols[index] = {
        ...db.protocols[index],
        editStatus: 'pending_review',
        editReviewNote: reviewNote || db.protocols[index].editReviewNote || '',
        reviewedAt: now
      };
    }
  } else {
    db.protocols[index] = {
      ...db.protocols[index],
      status,
      reviewNote: sanitizeString(req.body.reviewNote ?? db.protocols[index].reviewNote, 500),
      reviewedAt: now
    };
  }

  const trainerIndex = db.trainers.findIndex((trainer) => trainer.id === db.protocols[index].trainerId);
  if (trainerIndex !== -1) {
    syncTrainerPackageStatus(db, db.protocols[index].trainerId);
    if (reviewNote) {
      db.trainers[trainerIndex].reviewMessages = [
        ...(db.trainers[trainerIndex].reviewMessages || []),
        {
          id: makeId('review-note'),
          section: 'package',
          status,
          note: reviewNote,
          createdAt: new Date().toISOString()
        }
      ];
    }
  }
  await writeDB(db);
  res.json(db.protocols[index]);
}));

app.patch('/api/admin/trainers/:id/featured', requireRole('admin'), route(async (req, res) => {
  const db = await readDB();
  const index = db.trainers.findIndex((trainer) => trainer.id === req.params.id || trainer.userId === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Trainer not found' });

  const now = new Date().toISOString();
  const featuredStatus = ['none', 'requested', 'approved', 'rejected'].includes(req.body.featuredStatus)
    ? req.body.featuredStatus
    : db.trainers[index].featuredStatus || 'none';
  const featuredPaymentStatus = ['not_required', 'pending', 'verified', 'rejected'].includes(req.body.featuredPaymentStatus)
    ? req.body.featuredPaymentStatus
    : db.trainers[index].featuredPaymentStatus || 'not_required';
  const featuredPlacement = ['home', 'discover', 'all'].includes(req.body.featuredPlacement)
    ? req.body.featuredPlacement
    : db.trainers[index].featuredPlacement || 'home';

  db.trainers[index] = {
    ...db.trainers[index],
    featuredStatus,
    featuredPaymentStatus,
    featuredPlacement,
    featuredManual: Boolean(req.body.featuredManual),
    featuredUntil: sanitizeString(req.body.featuredUntil, 60),
    featuredNote: sanitizeString(req.body.featuredNote ?? db.trainers[index].featuredNote, 500),
    featuredApprovedAt: featuredStatus === 'approved' ? now : db.trainers[index].featuredApprovedAt || '',
    featuredRejectedAt: featuredStatus === 'rejected' ? now : '',
    updatedAt: now
  };

  if (featuredStatus === 'none') {
    db.trainers[index] = {
      ...db.trainers[index],
      featuredPaymentStatus: 'not_required',
      featuredManual: false,
      featuredUntil: '',
      featuredApprovedAt: '',
      featuredRejectedAt: ''
    };
  }

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
  const reviewNote = sanitizeString(req.body.reviewNote, 500);

  db.payments[paymentIndex] = {
    ...payment,
    status,
    reviewNote,
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
      paymentReviewNote: reviewNote,
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
        chatOpenedAt,
        paymentReviewNote: reviewNote
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

app.get('/api/health/storage', requireRole('admin'), route(async (_req, res) => {
  const db = await readDB();
  res.json({
    ok: true,
    store: supabaseStore ? 'supabase' : 'sqlite',
    storage: Boolean(supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY),
    trainers: db.trainers.length,
    payments: db.payments.length
  });
}));

app.post('/api/uploads', requireAuth, route(async (req, res) => {
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

// Dynamic sitemap with real trainer URLs
app.get('/sitemap.xml', route(async (_req, res) => {
  const db = await readDB();
  const blogSlugs = [
    'best-personal-trainer-lahore', 'personal-trainer-cost-pakistan', 'female-personal-trainer-pakistan',
    'home-vs-gym-training', 'wedding-fitness-pakistan', 'online-fitness-coach',
    'pakistani-diet-for-weight-loss', 'ramadan-fitness-guide', 'desi-protein-sources'
  ];
  const seoPages = [
    'personal-trainer-lahore', 'personal-trainer-karachi', 'personal-trainer-islamabad',
    'personal-trainer-rawalpindi', 'personal-trainer-faisalabad', 'personal-trainer-gujranwala',
    'personal-trainer-sialkot', 'online-fitness-coach-pakistan', 'female-personal-trainer-lahore',
    'home-personal-trainer-karachi', 'personal-trainer-dha-lahore', 'female-trainer-karachi',
    'online-fat-loss-coach-pakistan', 'home-trainer-lahore'
  ];
  const staticPages = [
    '', 'discover', 'blog', 'tools', 'transformations', 'compare', 'saved', 'faq',
    'refer', 'how-it-works', 'for-trainers', 'trust-safety', 'about', 'contact',
    'terms', 'privacy', 'refund-policy', 'onboarding', 'become-trainer', 'quiz',
    'login', 'register', 'register/client', 'register/trainer'
  ];

  const urls = [];
  for (const p of staticPages) {
    urls.push(`  <url><loc>https://${canonicalHost}/${p}</loc><changefreq>weekly</changefreq><priority>${p === '' ? '1.0' : p === 'discover' ? '0.9' : '0.7'}</priority></url>`);
  }
  for (const p of seoPages) {
    urls.push(`  <url><loc>https://${canonicalHost}/${p}</loc><changefreq>weekly</changefreq><priority>0.85</priority></url>`);
  }
  for (const slug of blogSlugs) {
    urls.push(`  <url><loc>https://${canonicalHost}/blog/${slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
  }
  for (const trainer of db.trainers) {
    if (isPublicTrainerProfile(trainer)) {
      const trainerUrl = trainer.slug ? `trainer/${trainer.slug}` : `trainer/${trainer.id}`;
      urls.push(`  <url><loc>https://${canonicalHost}/${trainerUrl}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
    }
  }

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`);
}));

const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir));

const htmlPath = path.join(distDir, 'index.html');
let htmlTemplate = '';
try {
  htmlTemplate = fs.readFileSync(htmlPath, 'utf8');
} catch (_) {
  htmlTemplate = '<!doctype html><html lang="en-PK"><head><meta charset="UTF-8"><title>Liftrz Pakistan</title></head><body><div id="root"></div></body></html>';
}

const routeMeta = {
  '/': {
    title: 'Liftrz Pakistan | Find Verified Personal Trainers Near You',
    description: 'Find and book verified personal trainers in Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Gujranwala and Sialkot. Compare prices, read real reviews, book a free trial.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Liftrz Pakistan',
      url: 'https://liftrz.com/',
      logo: 'https://liftrz.com/logo.svg',
      email: 'hey@liftrz.com',
      telephone: '03078977205',
      areaServed: ['Pakistan', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Gujranwala', 'Sialkot']
    }
  },
  '/discover': {
    title: 'Discover Verified Personal Trainers | Compare & Book | Liftrz Pakistan',
    description: 'Search and compare verified personal trainers across Pakistan. Filter by city, gender, specialty, price, and training mode. Read reviews from real clients.'
  },
  '/become-trainer': {
    title: 'Become a Trainer | Join Liftrz Pakistan & Grow Your Client Base',
    description: 'Apply to become a verified personal trainer on Liftrz Pakistan. Reach new clients, manage bookings, and grow your fitness coaching business.'
  },
  '/login': {
    title: 'Login | Liftrz Pakistan',
    description: 'Login to your Liftrz Pakistan account as a client, trainer, or admin.'
  },
  '/register': {
    title: 'Register | Liftrz Pakistan',
    description: 'Create your free Liftrz Pakistan account. Sign up as a client looking for a trainer, or as a trainer to list your services.'
  },
  '/quiz': {
    title: 'Find Your Trainer Quiz | Liftrz Pakistan',
    description: 'Take a quick quiz to find the perfect personal trainer for your fitness goals, budget, and location in Pakistan.'
  },
  '/blog': {
    title: 'Fitness Blog | Personal Training Tips for Pakistan | Liftrz',
    description: 'Guides on finding trainers, pricing, home workouts, wedding fitness, and online coaching in Pakistan.'
  },
  '/tools': {
    title: 'Free Fitness Calculators | BMI, Calories, Macros | Liftrz Pakistan',
    description: 'Free fitness calculators: BMI, calorie needs, macro split, and more. Plan your fitness journey with data.'
  },
  '/transformations': {
    title: 'Client Transformations | Before & After | Liftrz Pakistan',
    description: 'Real client transformations from verified Liftrz trainers. Before and after photos with documented fitness journeys.'
  },
  '/compare': {
    title: 'Compare Trainers Side-by-Side | Liftrz Pakistan',
    description: 'Compare up to 3 verified personal trainers by rating, price, specialty, and service mode.'
  },
  '/saved': {
    title: 'Saved Trainers | Your Shortlist | Liftrz Pakistan',
    description: 'View and manage your saved personal trainers shortlist.'
  },
  '/faq': {
    title: 'Frequently Asked Questions | Liftrz Pakistan',
    description: 'Answers to common questions about booking personal trainers, payments, reviews, and how Liftrz works.'
  },
  '/refer': {
    title: 'Refer a Friend | Earn Credits | Liftrz Pakistan',
    description: 'Refer friends to Liftrz Pakistan and earn credits toward your next trainer session or package.'
  },
  '/how-it-works': {
    title: 'How Liftrz Works | Commission-Protected Trainer Booking | Liftrz',
    description: 'Learn how Liftrz connects clients with verified trainers, manages payments, and protects both parties.'
  },
  '/for-trainers': {
    title: 'For Trainers | Grow Your Coaching Business | Liftrz Pakistan',
    description: 'Information for personal trainers: how to join, get verified, list services, and earn through Liftrz Pakistan.'
  },
  '/trust-safety': {
    title: 'Trust & Safety | Verified Trainers, Protected Payments | Liftrz',
    description: 'How Liftrz keeps you safe: trainer identity verification, commission-protected bookings, and verified reviews.'
  },
  '/about': {
    title: 'About Liftrz | Pakistan\'s Personal Trainer Marketplace',
    description: 'Liftrz connects clients in Pakistan with verified personal trainers for gym, home, and online coaching.'
  },
  '/contact': {
    title: 'Contact Us | Liftrz Pakistan',
    description: 'Get in touch with the Liftrz Pakistan team. We\'re here to help with bookings, trainer inquiries, and support.'
  },
  '/terms': {
    title: 'Terms of Service | Liftrz Pakistan',
    description: 'Read the terms of service for using the Liftrz Pakistan marketplace.'
  },
  '/privacy': {
    title: 'Privacy Policy | Liftrz Pakistan',
    description: 'How Liftrz Pakistan collects, uses, and protects your personal information.'
  },
  '/refund-policy': {
    title: 'Refund Policy | Liftrz Pakistan',
    description: 'Understand the refund and cancellation policy for bookings made through Liftrz Pakistan.'
  },
  '/onboarding': {
    title: 'Client Onboarding | Get Started | Liftrz Pakistan',
    description: 'Set up your fitness profile, choose your goals, and get matched with the right personal trainer.'
  },
  '/personal-trainer-lahore': {
    title: 'Personal Trainer Lahore | Verified Fitness Coaches | Liftrz',
    description: 'Find verified personal trainers in Lahore for gym, home and online coaching. Compare PKR pricing, reviews, completed bookings and trainer availability.'
  },
  '/personal-trainer-karachi': {
    title: 'Personal Trainer Karachi | Home, Gym & Online Coaches | Liftrz',
    description: 'Compare verified personal trainers in Karachi by area, rating, price, gender, response time and training mode.'
  },
  '/personal-trainer-islamabad': {
    title: 'Personal Trainer Islamabad | Verified Coaches | Liftrz',
    description: 'Book verified personal trainers in Islamabad for fat loss, strength, muscle gain, rehab and online coaching.'
  },
  '/personal-trainer-rawalpindi': {
    title: 'Personal Trainer Rawalpindi | Verified Gym Trainers | Liftrz',
    description: 'Search verified personal trainers in Rawalpindi and nearby Islamabad areas with transparent prices and booking records.'
  },
  '/personal-trainer-faisalabad': {
    title: 'Personal Trainer Faisalabad | Verified Fitness Coaches | Liftrz',
    description: 'Find verified personal trainers in Faisalabad for gym, home and online coaching. Compare PKR prices, reviews, training mode and availability.'
  },
  '/personal-trainer-gujranwala': {
    title: 'Personal Trainer Gujranwala | Verified Gym Trainers | Liftrz',
    description: 'Search verified personal trainers in Gujranwala for strength, fat loss, muscle gain and online coaching with transparent PKR pricing.'
  },
  '/personal-trainer-sialkot': {
    title: 'Personal Trainer Sialkot | Verified Fitness Coaches | Liftrz',
    description: 'Find verified personal trainers in Sialkot for gym, home visit and online coaching. Compare reviews, package prices and availability.'
  },
  '/online-fitness-coach-pakistan': {
    title: 'Online Fitness Coach Pakistan | Verified Online Trainers | Liftrz',
    description: 'Find online fitness coaches in Pakistan for fat loss, strength, muscle gain and habit-based coaching with verified reviews and payment tracking.'
  },
  '/female-personal-trainer-lahore': {
    title: 'Female Personal Trainer Lahore | Verified Coaches | Liftrz',
    description: 'Find female personal trainers in Lahore for gym, home and online coaching. Compare reviews, prices, service modes and availability.'
  },
  '/home-personal-trainer-karachi': {
    title: 'Home Personal Trainer Karachi | Verified Home Visit Trainers | Liftrz',
    description: 'Book home personal trainers in Karachi for strength, fat loss and general fitness. Compare verified trainers by area, rating and price.'
  },
  '/personal-trainer-dha-lahore': {
    title: 'Personal Trainer DHA Lahore | Verified Fitness Coaches | Liftrz',
    description: 'Find verified personal trainers serving DHA Lahore for gym, home visit and online coaching.'
  },
  '/female-trainer-karachi': {
    title: 'Female Trainer Karachi | Verified Personal Trainers | Liftrz',
    description: 'Search female personal trainers in Karachi for gym, home visit and online coaching.'
  },
  '/online-fat-loss-coach-pakistan': {
    title: 'Online Fat Loss Coach Pakistan | Verified Trainers | Liftrz',
    description: 'Find verified online fat loss coaches in Pakistan with reviewed packages and client transformations.'
  },
  '/home-trainer-lahore': {
    title: 'Home Trainer Lahore | Verified Home Visit Coaches | Liftrz',
    description: 'Book verified home trainers in Lahore for strength, fat loss, mobility and general fitness.'
  },
  '/register/client': {
    title: 'Register as Client | Liftrz Pakistan',
    description: 'Create your free client account on Liftrz Pakistan and find your perfect personal trainer.'
  },
  '/register/trainer': {
    title: 'Register as Trainer | Liftrz Pakistan',
    description: 'Apply to become a verified personal trainer on Liftrz Pakistan. Start receiving client inquiries.'
  },
  '/login/client': {
    title: 'Client Login | Liftrz Pakistan',
    description: 'Login to your client account on Liftrz Pakistan to manage bookings and chat with trainers.'
  },
  '/login/trainer': {
    title: 'Trainer Login | Liftrz Pakistan',
    description: 'Login to your trainer dashboard on Liftrz Pakistan to manage leads, bookings, and payouts.'
  },
  '/login/admin': {
    title: 'Admin Login | Liftrz Pakistan',
    description: 'Admin portal login for Liftrz Pakistan marketplace management.'
  },
  '/reset-password': {
    title: 'Reset Password | Liftrz Pakistan',
    description: 'Reset your Liftrz Pakistan account password.'
  }
};

function injectMeta(html, meta, canonical) {
  let result = html
    .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${meta.description}"`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${meta.title}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${meta.description}"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${canonical}"`)
    .replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${meta.title}"`)
    .replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${meta.description}"`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${canonical}"`);

  if (meta.jsonLd) {
    result = result.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
      ''
    );
    result = result.replace(
      '</head>',
      `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>\n</head>`
    );
  }

  return result;
}

app.get('*', route(async (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  const canonical = `https://${canonicalHost}${req.path}`;
  const meta = routeMeta[req.path];

  if (meta) {
    const html = injectMeta(htmlTemplate, meta, canonical);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }

  // Trainer profile pages: inject trainer-specific meta
  const trainerMatch = req.path.match(/^\/trainer\/(.+)$/);
  if (trainerMatch) {
    try {
      const db = await readDB();
      const lookupId = trainerMatch[1];
      const trainer = db.trainers.find(t => t.id === lookupId || t.slug === lookupId);
      if (trainer) {
        const trainerMeta = {
          title: `${trainer.name} | ${trainer.specialty || 'Personal'} Trainer in ${trainer.city} | Liftrz`,
          description: `Book ${trainer.name}, a verified ${trainer.specialty || 'personal trainer'} in ${trainer.city}, Pakistan. Compare packages, reviews and PKR pricing on Liftrz.`
        };
        const html = injectMeta(htmlTemplate, trainerMeta, canonical);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    } catch (_) { /* fallback to default template */ }
  }

  // Blog post pages: inject blog-specific meta
  const blogMatch = req.path.match(/^\/blog\/(.+)$/);
  if (blogMatch) {
    const posts = {
      'best-personal-trainer-lahore': { title: 'How to Find the Best Personal Trainer in Lahore', description: 'DHA, Gulberg, or Johar Town? We break down what to look for in a Lahore-based trainer and how much you should expect to pay.' },
      'personal-trainer-cost-pakistan': { title: 'Personal Trainer Cost in Pakistan (2026)', description: 'From PKR 1,500 per session to PKR 50,000 monthly packages. Here is the complete pricing breakdown across Lahore, Karachi, and Islamabad.' },
      'female-personal-trainer-pakistan': { title: 'Why More Women in Pakistan Are Hiring Female Personal Trainers', description: 'Privacy, comfort, and cultural preferences. We explore the growing demand for female trainers.' },
      'home-vs-gym-training': { title: 'Home Training vs Gym Training: Which is Better?', description: 'No time for the gym? A trainer who comes to your home might be the answer. We compare costs, results, and convenience.' },
      'wedding-fitness-pakistan': { title: 'Wedding Fitness: How to Get in Shape in 3 Months', description: 'The ultimate guide for brides and grooms in Pakistan. Nutrition, workouts, and realistic timelines for your big day.' },
      'online-fitness-coach': { title: 'Do Online Fitness Coaches Actually Work?', description: 'Virtual training exploded post-COVID. We look at the pros, cons, and who online coaching is actually best for.' },
      'pakistani-diet-for-weight-loss': { title: 'Pakistani Diet for Weight Loss: What Actually Works', description: 'Roti, biryani, and chai are not the enemy. We break down how to eat Pakistani food and still lose weight sustainably.' },
      'ramadan-fitness-guide': { title: 'Ramadan Fitness Guide: Train Without Losing Muscle', description: 'How to structure your workouts, manage hydration, and maintain strength during Ramadan fasting in Pakistan.' },
      'desi-protein-sources': { title: 'Cheap Protein Sources in Pakistan (Non-Meat Included)', description: 'Eggs, daal, chana, dahi, and paneer. Here is how to hit your protein goals on a Pakistani budget.' }
    };
    const post = posts[blogMatch[1]];
    if (post) {
      const blogMeta = {
        title: `${post.title} | Liftrz Blog`,
        description: post.description
      };
      const html = injectMeta(htmlTemplate, blogMeta, canonical);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }
  }

  res.sendFile(htmlPath);
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
