export function rebuildSrt(cues) {
  return cues
    .map((cue, index) => {
      const sequence = cue.sequence || index + 1;
      return [sequence, `${cue.start} --> ${cue.end}`, cue.text || ""].join("\n");
    })
    .join("\n\n")
    .concat("\n");
}
