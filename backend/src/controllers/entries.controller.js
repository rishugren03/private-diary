import Entry from '../models/Entry.js';

// GET /api/entries — all entries for the logged-in user (ciphertext only)
export async function getAll(req, res) {
  try {
    const entries = await Entry.find({ userId: req.userId })
      .select('date iv encryptedData updatedAt')
      .sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/entries/:date
export async function getOne(req, res) {
  try {
    const entry = await Entry.findOne({ userId: req.userId, date: req.params.date });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

// PUT /api/entries/:date — upsert
export async function upsert(req, res) {
  try {
    const { iv, encryptedData } = req.body;
    if (!iv || !encryptedData) {
      return res.status(400).json({ error: 'iv and encryptedData are required' });
    }

    const date = req.params.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format, use YYYY-MM-DD' });
    }

    const entry = await Entry.findOneAndUpdate(
      { userId: req.userId, date },
      { iv, encryptedData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(entry);
  } catch (err) {
    console.error('upsert error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// DELETE /api/entries/:date
export async function remove(req, res) {
  try {
    await Entry.findOneAndDelete({ userId: req.userId, date: req.params.date });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}
