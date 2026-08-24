import Chapter from '../models/Chapter.js';

export async function getAll(req, res) {
  try {
    const chapters = await Chapter.find({ bookId: req.params.bookId, userId: req.userId })
      .select('iv encryptedData order updatedAt')
      .sort({ order: 1 });
    res.json(chapters);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getOne(req, res) {
  try {
    const chapter = await Chapter.findOne({ _id: req.params.id, bookId: req.params.bookId, userId: req.userId });
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
    res.json(chapter);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function create(req, res) {
  try {
    const { iv, encryptedData, order } = req.body;
    if (!iv || !encryptedData) {
      return res.status(400).json({ error: 'iv and encryptedData are required' });
    }

    const chapter = new Chapter({
      userId: req.userId,
      bookId: req.params.bookId,
      iv,
      encryptedData,
      order: order || 0
    });
    await chapter.save();
    res.status(201).json(chapter);
  } catch (err) {
    console.error('chapter create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function update(req, res) {
  try {
    const { iv, encryptedData, order } = req.body;
    if (!iv || !encryptedData) {
      return res.status(400).json({ error: 'iv and encryptedData are required' });
    }

    const chapter = await Chapter.findOneAndUpdate(
      { _id: req.params.id, bookId: req.params.bookId, userId: req.userId },
      { iv, encryptedData, order },
      { new: true }
    );
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
    res.json(chapter);
  } catch (err) {
    console.error('chapter update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function remove(req, res) {
  try {
    const chapter = await Chapter.findOneAndDelete({ _id: req.params.id, bookId: req.params.bookId, userId: req.userId });
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}
