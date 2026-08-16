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
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
