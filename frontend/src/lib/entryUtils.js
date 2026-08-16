/**
 * Normalizes an entry object to guarantee a `thoughts` array structure.
 * Handles backward compatibility for older single-text entries.
 */
export function normalizeEntry(raw) {
  if (!raw) return { thoughts: [] };

  if (Array.isArray(raw.thoughts)) {
    return { ...raw, thoughts: raw.thoughts };
  }

  // Legacy format { text, mood, tags } → convert to single-item thoughts array
  if (raw.text || raw.mood || (raw.tags && raw.tags.length > 0)) {
    return {
      ...raw,
      thoughts: [
        {
          id: `legacy-${Date.now()}`,
          time: '12:00 PM',
          text: raw.text || '',
          mood: raw.mood || null,
          tags: raw.tags || [],
          createdAt: raw.updatedAt || new Date().toISOString(),
        },
      ],
    };
  }

  return { ...raw, thoughts: [] };
}
