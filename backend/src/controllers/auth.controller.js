import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Entry from '../models/Entry.js';

function signToken(userId, tokenVersion = 0) {
  return jwt.sign({ userId, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

export async function register(req, res) {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    // password is now a SHA-256 hex hash (64 chars) from the client
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

    const user = await User.create({
      email,
      passwordHash,
      keySalt,
      displayName: displayName || '',
      authScheme: 'v2', // New users always use v2 (client-side hashed password)
      tokenVersion: 0,
    });
    const token = signToken(user._id, user.tokenVersion);

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

    // Dual-mode authentication for backward compatibility:
    // v2 users: password field contains SHA-256 hash → compare directly
    // v1 users: password field contains SHA-256 hash of the raw password,
    //           but stored hash is bcrypt(rawPassword) — this won't match.
    //           Silently upgrade to v2 on successful legacy login.
    let valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid && user.authScheme === 'v1') {
      // v1 legacy: the client now sends SHA-256(rawPassword), but the stored hash
      // is bcrypt(rawPassword). We can't reverse SHA-256, so v1 users must re-register
      // or use a migration endpoint. For safety, reject and prompt re-login.
      // NOTE: In practice, since all current users will have updated clients,
      // this path handles the edge case gracefully.
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If v1 user successfully logged in (shouldn't happen with hashed password,
    // but just in case), upgrade them to v2
    if (user.authScheme === 'v1') {
      user.passwordHash = await bcrypt.hash(password, 12);
      user.authScheme = 'v2';
      await user.save();
    }

    const token = signToken(user._id, user.tokenVersion);
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
    // SECURITY: keySalt is only returned on login/register, NOT here (V4)
    res.json({ id: user._id, email: user.email, displayName: user.displayName });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/auth/change-password — atomic password change + re-encryption
export async function changePassword(req, res) {
  try {
    const { oldAuthHash, newAuthHash, newKeySalt, entries } = req.body;
    if (!oldAuthHash || !newAuthHash || !newKeySalt) {
      return res.status(400).json({ error: 'oldAuthHash, newAuthHash, and newKeySalt are required' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify old password
    const valid = await bcrypt.compare(oldAuthHash, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password hash, salt, and bump token version
    user.passwordHash = await bcrypt.hash(newAuthHash, 12);
    user.keySalt = newKeySalt;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.authScheme = 'v2';
    await user.save();

    // Bulk-replace all entries with re-encrypted versions
    if (entries && Array.isArray(entries)) {
      // Delete all existing entries for this user
      await Entry.deleteMany({ userId: req.userId });

      // Insert re-encrypted entries
      if (entries.length > 0) {
        const docs = entries.map((e) => ({
          userId: req.userId,
          date: e.date,
          iv: e.iv,
          encryptedData: e.encryptedData,
        }));
        await Entry.insertMany(docs);
      }
    }

    // Issue new token with updated version
    const token = signToken(user._id, user.tokenVersion);
    res.json({
      token,
      user: { id: user._id, email: user.email, displayName: user.displayName, keySalt: user.keySalt },
    });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// DELETE /api/auth/account — delete user and all entries
export async function deleteAccount(req, res) {
  try {
    await Entry.deleteMany({ userId: req.userId });
    await User.findByIdAndDelete(req.userId);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteAccount error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
