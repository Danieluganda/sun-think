import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { config } from "../../config/index.js";

let mappingsState = loadMappings();

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanUrls(urls = {}) {
  return Object.fromEntries(
    Object.entries(urls)
      .map(([language, url]) => [cleanText(language).toLowerCase(), cleanText(url)])
      .filter(([language, url]) => language && url)
  );
}

function normalizeMapping(input = {}) {
  const selector = cleanText(input.selector);
  const srcIncludes = cleanText(input.srcIncludes);
  const urls = cleanUrls(input.urls);

  if (!selector && !srcIncludes) {
    throw new Error("Provide selector or srcIncludes for the embedded content");
  }

  if (!Object.keys(urls).length) {
    throw new Error("Provide at least one language URL");
  }

  return {
    id: cleanText(input.id) || crypto.randomUUID(),
    label: cleanText(input.label) || srcIncludes || selector,
    selector,
    srcIncludes,
    urls,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function emptyState() {
  return {
    version: 1,
    updatedAt: null,
    mappings: []
  };
}

function loadMappings() {
  try {
    if (!fs.existsSync(config.embedMappingsPath)) return emptyState();

    const parsed = JSON.parse(fs.readFileSync(config.embedMappingsPath, "utf8"));
    return {
      ...emptyState(),
      ...parsed,
      mappings: Array.isArray(parsed.mappings) ? parsed.mappings : []
    };
  } catch {
    return emptyState();
  }
}

function saveMappings() {
  fs.mkdirSync(path.dirname(config.embedMappingsPath), { recursive: true });
  const tempPath = `${config.embedMappingsPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(mappingsState, null, 2)}\n`);
  fs.renameSync(tempPath, config.embedMappingsPath);
}

export function getEmbedMappings() {
  return {
    mappings: [...mappingsState.mappings],
    updatedAt: mappingsState.updatedAt,
    storagePath: config.embedMappingsPath
  };
}

export function upsertEmbedMapping(mapping) {
  const normalized = normalizeMapping(mapping);
  const existingIndex = mappingsState.mappings.findIndex((item) => item.id === normalized.id);

  if (existingIndex >= 0) {
    mappingsState.mappings[existingIndex] = {
      ...normalized,
      createdAt: mappingsState.mappings[existingIndex].createdAt || normalized.createdAt
    };
  } else {
    mappingsState.mappings.push(normalized);
  }

  mappingsState.updatedAt = new Date().toISOString();
  saveMappings();
  return getEmbedMappings();
}

export function removeEmbedMapping(id) {
  const cleanId = cleanText(id);
  mappingsState = {
    ...mappingsState,
    updatedAt: new Date().toISOString(),
    mappings: mappingsState.mappings.filter((mapping) => mapping.id !== cleanId)
  };
  saveMappings();
  return getEmbedMappings();
}
