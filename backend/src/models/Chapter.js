import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    order: {
        type: Number,
        required: true,
        default: 0
    },
    // AES-GCM IV stored as Base64
    iv: {
      type: String,
      required: true,
    },
    // Encrypted JSON payload (title, content text) as Base64
    encryptedData: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Chapter', chapterSchema);
