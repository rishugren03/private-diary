import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // YYYY-MM-DD — one entry per day per user
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    // AES-GCM IV stored as Base64 (12 bytes → 16 chars base64)
    iv: {
      type: String,
      required: true,
    },
    // Encrypted JSON payload (text + mood + tags) as Base64
    encryptedData: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index: one entry per user per date
entrySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('Entry', entrySchema);
