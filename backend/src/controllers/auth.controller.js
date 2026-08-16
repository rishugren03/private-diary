import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

export async function register(req, res) {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    // Generate a random PBKDF2 salt for client-side key derivation
    // Stored on server so user can derive same key from any device
    const keySalt = crypto.randomBytes(32).toString('base64');

    const user = await User.create({ email, passwordHash, keySalt, displayName: displayName || '' });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, displayName: user.displayName, keySalt: user.keySalt },
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, email: user.email, displayName: user.displayName, keySalt: user.keySalt },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function me(req, res) {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user._id, email: user.email, displayName: user.displayName, keySalt: user.keySalt });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}
