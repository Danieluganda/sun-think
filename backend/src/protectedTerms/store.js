import fs from "node:fs";
import path from "node:path";
import { config } from "../../config/index.js";

const defaultTerms = [
  "10X",
  "The 10X Program",
  "10X Program",
  "10X Academy",
  "10X Foundation Course",
  "Outbox",
  "UNCDF",
  "Mastercard Foundation",
  "Thinkific",
  "Sunbird"
];

let termsState = loadTerms();

function normalizeTerm(term) {
  return String(term || "").replace(/\s+/g, " ").trim();
}

function uniqueTerms(terms) {
  const seen = new Set();
  return terms
    .map(normalizeTerm)
    .filter(Boolean)
    .filter((term) => {
      const key = term.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((first, second) => first.localeCompare(second));
}

function emptyState() {
  return {
    version: 1,
    updatedAt: null,
    terms: defaultTerms
  };
}

function loadTerms() {
  try {
    if (!fs.existsSync(config.protectedTermsPath)) {
      return emptyState();
    }

    const parsed = JSON.parse(fs.readFileSync(config.protectedTermsPath, "utf8"));
    return {
      ...emptyState(),
      ...parsed,
      terms: uniqueTerms(parsed.terms || defaultTerms)
    };
  } catch {
    return emptyState();
  }
}

function saveTerms() {
  fs.mkdirSync(path.dirname(config.protectedTermsPath), { recursive: true });
  const tempPath = `${config.protectedTermsPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(termsState, null, 2)}\n`);
  fs.renameSync(tempPath, config.protectedTermsPath);
}

export function getProtectedTerms() {
  return {
    terms: [...termsState.terms],
    updatedAt: termsState.updatedAt,
    storagePath: config.protectedTermsPath
  };
}

export function addProtectedTerm(term) {
  const cleanTerm = normalizeTerm(term);
  if (!cleanTerm) {
    throw new Error("Protected term is required");
  }

  termsState = {
    ...termsState,
    updatedAt: new Date().toISOString(),
    terms: uniqueTerms([...termsState.terms, cleanTerm])
  };
  saveTerms();
  return getProtectedTerms();
}

export function removeProtectedTerm(term) {
  const cleanTerm = normalizeTerm(term);
  termsState = {
    ...termsState,
    updatedAt: new Date().toISOString(),
    terms: termsState.terms.filter((item) => item.toLowerCase() !== cleanTerm.toLowerCase())
  };
  saveTerms();
  return getProtectedTerms();
}
