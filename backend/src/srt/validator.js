export function validateCues(cues) {
  if (!Array.isArray(cues)) return { valid: false, errors: ["Cues must be an array"] };

  const errors = [];
  cues.forEach((cue, index) => {
    if (!cue.start || !cue.end) errors.push(`Cue ${index + 1} is missing timing`);
    if (typeof cue.text !== "string") errors.push(`Cue ${index + 1} is missing text`);
  });

  return { valid: errors.length === 0, errors };
}
