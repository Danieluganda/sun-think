import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { config } from "../../config/index.js";

const maxEntries = Number(process.env.TRANSLATION_CACHE_MAX_ENTRIES || 20000);
const cache = loadCache();

function emptyCache() {
  return {
    version: 1,
    updatedAt: null,
    entries: {}
  };
}

function normalizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function cacheKey({ text, sourceLanguage, targetLanguage }) {
  const normalized = normalizeText(text);
  const digest = crypto
    .createHash("sha256")
    .update(`${sourceLanguage}:${targetLanguage}:${normalized}`)
    .digest("hex");

  return digest;
}

function loadCache() {
  try {
    if (!fs.existsSync(config.translationCachePath)) return emptyCache();

    const parsed = JSON.parse(fs.readFileSync(config.translationCachePath, "utf8"));
    return {
      ...emptyCache(),
      ...parsed,
      entries: parsed.entries || {}
    };
  } catch {
    return emptyCache();
  }
}

function saveCache() {
  try {
    fs.mkdirSync(path.dirname(config.translationCachePath), { recursive: true });
    const tempPath = `${config.translationCachePath}.tmp`;
    fs.writeFileSync(tempPath, `${JSON.stringify(cache, null, 2)}\n`);
    fs.renameSync(tempPath, config.translationCachePath);
  } catch {
    // Cache persistence should not block translation responses.
  }
}

function pruneCache() {
  const entries = Object.entries(cache.entries);
  if (entries.length <= maxEntries) return;

  const keep = entries
    .sort((first, second) => String(second[1].lastUsedAt || "").localeCompare(String(first[1].lastUsedAt || "")))
    .slice(0, maxEntries);

  cache.entries = Object.fromEntries(keep);
}

export function getCachedTranslation({ text, sourceLanguage, targetLanguage }) {
  const key = cacheKey({ text, sourceLanguage, targetLanguage });
  const entry = cache.entries[key];
  if (!entry) return null;

  entry.lastUsedAt = new Date().toISOString();
  entry.hitCount = (entry.hitCount || 0) + 1;

  return entry.translatedText;
}

export function setCachedTranslation({ text, sourceLanguage, targetLanguage, translatedText, persist = true }) {
  const normalized = normalizeText(text);
  if (!normalized || !translatedText) return;

  const now = new Date().toISOString();
  const key = cacheKey({ text: normalized, sourceLanguage, targetLanguage });
  const existing = cache.entries[key];

  cache.entries[key] = {
    sourceLanguage,
    targetLanguage,
    sourceText: normalized,
    translatedText,
    createdAt: existing?.createdAt || now,
    lastUsedAt: now,
    hitCount: existing?.hitCount || 0
  };

  cache.updatedAt = now;
  pruneCache();
  if (persist) saveCache();
}

export function flushTranslationCache() {
  saveCache();
}

export function getTranslationCacheSummary() {
  return {
    entries: Object.keys(cache.entries).length,
    maxEntries,
    storagePath: config.translationCachePath,
    updatedAt: cache.updatedAt
  };
}
