import { config } from "../../config/index.js";
import { trackApiCall } from "../logger/metrics.js";

const languageMap = {
  eng: "en",
  ach: "ach",
  lug: "lg",
  swa: "sw"
};

export function canUseGoogleTranslate({ sourceLanguage, targetLanguage }) {
  return Boolean(
    config.googleTranslate.key &&
    languageMap[sourceLanguage] &&
    languageMap[targetLanguage]
  );
}

export async function googleTranslateText({ text, sourceLanguage, targetLanguage }) {
  if (!canUseGoogleTranslate({ sourceLanguage, targetLanguage })) {
    const error = new Error(`Google fallback does not support ${sourceLanguage} to ${targetLanguage}`);
    error.statusCode = 400;
    throw error;
  }

  return trackApiCall("google-translate", async () => {
    const url = new URL(config.googleTranslate.apiUrl);
    url.searchParams.set("key", config.googleTranslate.key);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: languageMap[sourceLanguage],
        target: languageMap[targetLanguage],
        format: "text"
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const detail = payload.error?.message || payload.error || response.statusText;
      const error = new Error(`Google Translate request failed: ${response.status} ${detail}`);
      error.statusCode = response.status;
      throw error;
    }

    const payload = await response.json();
    const translatedText = payload.data?.translations?.[0]?.translatedText;
    if (!translatedText) {
      const error = new Error("Google Translate response did not include translated text");
      error.statusCode = response.status;
      throw error;
    }

    return { value: translatedText, statusCode: response.status };
  });
}
