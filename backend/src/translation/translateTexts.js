import { getCachedTranslation, setCachedTranslation, flushTranslationCache } from "../cache/translationCache.js";
import { canUseGoogleTranslate, googleTranslateText } from "../google/translate.js";
import { incrementMetric } from "../logger/metrics.js";
import { sunbirdTranslateText } from "../sunbird/client.js";

const defaultConcurrency = Number(process.env.TRANSLATION_CONCURRENCY || 3);

function normalizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

export async function translateTexts({
  texts,
  sourceLanguage,
  targetLanguage,
  concurrency = defaultConcurrency
}) {
  const translations = new Array(texts.length);
  const misses = [];
  const missingByText = new Map();
  let cacheHits = 0;
  let duplicateMisses = 0;

  texts.forEach((text, index) => {
    const cached = getCachedTranslation({ text, sourceLanguage, targetLanguage });
    if (cached) {
      translations[index] = cached;
      cacheHits += 1;
      incrementMetric("translation.cache.hit");
      return;
    }

    incrementMetric("translation.cache.miss");
    const normalized = normalizeText(text);
    if (!missingByText.has(normalized)) {
      missingByText.set(normalized, {
        text,
        indexes: []
      });
      misses.push(missingByText.get(normalized));
    } else {
      duplicateMisses += 1;
    }
    missingByText.get(normalized).indexes.push(index);
  });

  await mapWithConcurrency(misses, concurrency, async (miss) => {
    let provider = "sunbird";
    let translatedText;

    try {
      translatedText = await sunbirdTranslateText({
        text: miss.text,
        sourceLanguage,
        targetLanguage
      });
    } catch (error) {
      if ((error.statusCode === 429 || /quota/i.test(error.message)) && canUseGoogleTranslate({ sourceLanguage, targetLanguage })) {
        provider = "google-translate";
        incrementMetric("translation.fallback.google");
        translatedText = await googleTranslateText({
          text: miss.text,
          sourceLanguage,
          targetLanguage
        });
      } else {
        throw error;
      }
    }

    setCachedTranslation({
      text: miss.text,
      sourceLanguage,
      targetLanguage,
      translatedText,
      persist: false
    });

    miss.indexes.forEach((index) => {
      translations[index] = translatedText;
    });

    incrementMetric(`translation.provider.${provider}`);
  });

  if (misses.length) flushTranslationCache();

  return {
    translations,
    cache: {
      hits: cacheHits,
      misses: misses.length,
      duplicateMisses,
      concurrency
    }
  };
}
