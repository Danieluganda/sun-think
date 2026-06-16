import { chunkCues } from "./chunker.js";
import { sunbirdTranslateText } from "./client.js";

export async function translateCues(cues, { sourceLanguage = "eng", targetLanguage }) {
  const translated = [];

  for (const chunk of chunkCues(cues)) {
    const text = chunk.map((cue) => cue.text).join("\n\n");
    const translatedText = await sunbirdTranslateText({ text, sourceLanguage, targetLanguage });
    const translatedBlocks = String(translatedText).split(/\n{2,}/);

    chunk.forEach((cue, index) => {
      translated.push({
        ...cue,
        text: translatedBlocks[index] || translatedBlocks.join("\n").trim() || cue.text
      });
    });
  }

  return translated;
}
