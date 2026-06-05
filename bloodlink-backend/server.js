require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Blacklist JWT en mémoire (remplacer par Redis en prod haute disponibilité)
const jwtBlacklist = new Set();
module.exports.jwtBlacklist = jwtBlacklist;

const authRoutes      = require('./routes/auth.routes');
const donneurRoutes   = require('./routes/donneur.routes');
const structureRoutes = require('./routes/structure.routes');
const adminRoutes     = require('./routes/admin.routes');
const iaRoutes        = require('./routes/ia.routes');
const messageRoutes   = require('./routes/message.routes');
const stockRoutes     = require('./routes/stock.routes');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── MIDDLEWARE GLOBAL ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'"],
      objectSrc:  ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS — autorise Live Server (5500) et autres origines locales
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser sans origin (Thunder Client, Postman en dev uniquement)
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (origin && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`Origine non autorisée : ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// ── RATE LIMITING ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Trop de requêtes. Réessayez dans 15 minutes.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' }
});
app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);

// ── ROUTES ────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/donneur',   donneurRoutes);
app.use('/api/structure', structureRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/ia',        iaRoutes);
app.use('/api/messages',  messageRoutes);
app.use('/api/stock',     stockRoutes);

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'BloodLink API opérationnelle',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} introuvable` });
});

// ── ERROR HANDLER ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);
  res.status(500).json({ success: false, message: 'Erreur serveur interne' });
});

// ── DÉMARRAGE ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  BloodLink API  ');
  console.log('  Kɛnɛya Digital Guinée');
  console.log('');
  console.log('  Serveur : http://localhost:' + PORT);
  console.log('  Health  : http://localhost:' + PORT + '/api/health');
  console.log('');
});

module.exports = app;