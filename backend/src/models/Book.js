import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // AES-GCM IV stored as Base64
    iv: {
      type: String,
      required: true,
    },
    // Encrypted JSON payload (title, description, cover) as Base64
    encryptedData: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Book', bookSchema);
