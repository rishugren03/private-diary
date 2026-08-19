import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    // PBKDF2 salt stored as Base64 — used client-side to re-derive AES key
    // The server stores this so the same key can be derived on any device
    keySalt: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      default: '',
    },
    // Auth scheme version:
    // 'v1' = legacy (server received raw password, bcrypt(password))
    // 'v2' = secure (server receives SHA-256 hash, bcrypt(sha256hash))
    authScheme: {
      type: String,
      default: 'v1',
      enum: ['v1', 'v2'],
    },
    // Token version — incremented on password change to invalidate old JWTs
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
