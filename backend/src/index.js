import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import entriesRoutes from './routes/entries.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'https://personal-diary-blue.vercel.app'],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

// Rate limiting
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
}));
app.use('/api/entries', rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/entries', entriesRoutes);

// Health check
app.get('/health', (_, res) => res.json({
  status: 'ok',
  dbState: mongoose.connection.readyState,
  dbHost: mongoose.connection.host || 'disconnected'
}));

// 404 handler
app.use((_, res) => res.status(404).json({ error: 'Not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
});

// Database connection logic with Atlas + Persistent Local Disk DB Fallback
async function connectDB() {
  const atlasUri = process.env.MONGO_URI;

  if (atlasUri) {
    try {
      console.log('Connecting to MongoDB Atlas cluster...');
      await mongoose.connect(atlasUri, { serverSelectionTimeoutMS: 4000 });
      console.log('✅ Connected to MongoDB Atlas cloud database!');
      return;
    } catch (err) {
      console.warn('\n------------------------------------------------------------');
      console.warn('⚠️ Atlas Connection Failed (IP Whitelist Constraint):');
      console.warn(err.message);
      console.warn('\n👉 To save data in MongoDB Atlas cloud:');
      console.warn('   Go to https://cloud.mongodb.com -> Network Access -> Add IP (0.0.0.0/0)');
      console.warn('------------------------------------------------------------\n');
    }
  }

  // Persistent disk fallback using MongoMemoryServer with dbPath
  try {
    const dataDir = path.join(__dirname, '../data/db');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log('🔄 Initializing persistent local MongoDB database at:', dataDir);
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        dbPath: dataDir,
        storageEngine: 'wiredTiger',
      },
    });

    const memUri = mongoServer.getUri();
    await mongoose.connect(memUri);
    console.log('✅ Connected to persistent local MongoDB database!');
  } catch (memErr) {
    console.warn('⚠️ Persistent disk init notice:', memErr.message);
    // Standard in-memory fallback if lock exists
    try {
      const memoryOnlyServer = await MongoMemoryServer.create();
      await mongoose.connect(memoryOnlyServer.getUri());
      console.log('✅ Connected to in-memory database fallback!');
    } catch (finalErr) {
      console.error('❌ Database connection error:', finalErr.message);
    }
  }
}

connectDB();

export default app;
