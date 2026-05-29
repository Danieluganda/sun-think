import express from "express";
import { getNllbSupportedLanguage } from "../../../config/languages.js";
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

    const translations = [];
    for (const text of texts) {
      translations.push(
        await sunbirdTranslateText({
          text,
          sourceLanguage,
          targetLanguage
        })
      );
    }

    return res.json({ translations });
  } catch (error) {
    return next(error);
  }
});
