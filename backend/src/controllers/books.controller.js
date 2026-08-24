import Book from '../models/Book.js';

export async function getAll(req, res) {
  try {
    const books = await Book.find({ userId: req.userId })
      .select('iv encryptedData updatedAt')
      .sort({ updatedAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getOne(req, res) {
  try {
    const book = await Book.findOne({ _id: req.params.id, userId: req.userId });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function create(req, res) {
  try {
    const { iv, encryptedData } = req.body;
    if (!iv || !encryptedData) {
      return res.status(400).json({ error: 'iv and encryptedData are required' });
    }

    const book = new Book({
      userId: req.userId,
      iv,
      encryptedData
    });
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    console.error('book create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function update(req, res) {
  try {
    const { iv, encryptedData } = req.body;
    if (!iv || !encryptedData) {
      return res.status(400).json({ error: 'iv and encryptedData are required' });
    }

    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { iv, encryptedData },
      { new: true }
    );
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    console.error('book update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function remove(req, res) {
  try {
    const book = await Book.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}
