export function chunkCues(cues, { maxCharacters = 3500 } = {}) {
  const chunks = [];
  let current = [];
  let size = 0;

  for (const cue of cues) {
    const cueSize = cue.text.length + 1;
    if (current.length && size + cueSize > maxCharacters) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(cue);
    size += cueSize;
  }

  if (current.length) chunks.push(current);
  return chunks;
}
