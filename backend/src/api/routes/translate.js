import express from "express";
import { getNllbSupportedLanguage } from "../../../config/languages.js";
import { flushTranslationCache, getCachedTranslation, setCachedTranslation } from "../../cache/translationCache.js";
import { incrementMetric } from "../../logger/metrics.js";
import { sunbirdTranslateText } from "../../sunbird/client.js";

export const translateRouter = express.Router();

translateRouter.post("/page", async (req, res, next) => {
  try {
    const {
      texts = [],
      sourceLanguage = "eng",
      targetLanguage
    } = req.body || {};

    if (!targetLanguage) {
      return res.status(400).json({ error: "targetLanguage is required" });
    }

    if (!getNllbSupportedLanguage(sourceLanguage)) {
      return res.status(400).json({
        error: `Unsupported sourceLanguage for NLLB translation: ${sourceLanguage}`
      });
    }

    if (!getNllbSupportedLanguage(targetLanguage)) {
      return res.status(400).json({
        error: `Unsupported targetLanguage for NLLB translation: ${targetLanguage}`
      });
    }

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: "texts must be a non-empty array" });
    }

    const translations = new Array(texts.length);
    const misses = [];
    const missingByText = new Map();

    texts.forEach((text, index) => {
      const cached = getCachedTranslation({ text, sourceLanguage, targetLanguage });
      if (cached) {
        translations[index] = cached;
        incrementMetric("translation.cache.hit");
        return;
      }

      incrementMetric("translation.cache.miss");
      const normalized = String(text || "").replace(/\s+/g, " ").trim();
      if (!missingByText.has(normalized)) {
        missingByText.set(normalized, {
          text,
          indexes: []
        });
        misses.push(missingByText.get(normalized));
      }
      missingByText.get(normalized).indexes.push(index);
    });

    for (const miss of misses) {
      const translatedText = await sunbirdTranslateText({
        text: miss.text,
        sourceLanguage,
        targetLanguage
      });

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
    }

    if (misses.length) flushTranslationCache();

    return res.json({
      translations,
      cache: {
        hits: texts.length - misses.reduce((sum, miss) => sum + miss.indexes.length, 0),
        misses: misses.length
      }
    });
  } catch (error) {
    if (error.statusCode === 429 || /quota/i.test(error.message)) {
      return res.status(429).json({
        error: "Daily translation quota reached. Please try again after the Sunbird quota resets.",
        code: "quota_exceeded"
      });
    }

    return next(error);
  }
});
