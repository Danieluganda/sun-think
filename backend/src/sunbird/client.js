import { config } from "../../config/index.js";
import { trackApiCall } from "../logger/metrics.js";
import { withRetry } from "./retry.js";

export async function sunbirdTranslateText({ text, sourceLanguage, targetLanguage }) {
  if (!config.sunbird.apiUrl || !config.sunbird.key) {
    throw new Error("SUNBIRD_API_URL and SUNBIRD_API_KEY are required for translation");
  }

  return trackApiCall("sunbird", () =>
    withRetry(async () => {
      const response = await fetch(config.sunbird.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.sunbird.key}`
        },
        body: JSON.stringify({
          text,
          source_language: sourceLanguage,
          target_language: targetLanguage
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const detail = payload.detail || payload.error || payload.message || response.statusText;
        const error = new Error(`Sunbird request failed: ${response.status} ${detail}`);
        error.statusCode = response.status;
        throw error;
      }

      const payload = await response.json();
      const output = payload.output || {};
      const translatedText =
        output.translated_text ||
        payload.translated_text ||
        payload.translation ||
        payload.translatedText ||
        payload.text;

      if (!translatedText) {
        const error = new Error("Sunbird response did not include translated text");
        error.statusCode = response.status;
        throw error;
      }

      return { value: translatedText, statusCode: response.status };
    }, {
      shouldRetry: (error) => error.statusCode !== 429
    })
  );
}
