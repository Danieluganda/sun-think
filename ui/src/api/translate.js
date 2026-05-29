import { apiRequest } from "./client.js";

export function testTranslation({ text, sourceLanguage, targetLanguage }) {
  return apiRequest("/translate/page", {
    method: "POST",
    body: JSON.stringify({
      texts: [text],
      sourceLanguage,
      targetLanguage
    })
  });
}
