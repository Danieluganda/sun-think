export const sourceLanguage = {
  code: "eng",
  name: "English"
};

export const targetLanguages = [
  { code: "ach", name: "Acholi" },
  { code: "adh", name: "Jopadhola" },
  { code: "alz", name: "Alur" },
  { code: "bfa", name: "Bari" },
  { code: "cgg", name: "Rukiga" },
  { code: "gwr", name: "Lugwere" },
  { code: "kdi", name: "Kumam" },
  { code: "kdj", name: "Karamojong" },
  { code: "keo", name: "Kakwa" },
  { code: "kin", name: "Kinyarwanda" },
  { code: "koo", name: "Rukonjo" },
  { code: "kpz", name: "Kupsabiny" },
  { code: "laj", name: "Lango" },
  { code: "lgg", name: "Lugbara" },
  { code: "lsm", name: "Samia" },
  { code: "luc", name: "Aringa" },
  { code: "lug", name: "Luganda" },
  { code: "mhi", name: "Ma'di" },
  { code: "myx", name: "Lumasaba" },
  { code: "nuj", name: "Lunyole" },
  { code: "nyn", name: "Runyankole" },
  { code: "nyo", name: "Runyoro" },
  { code: "pok", name: "Pokot" },
  { code: "rub", name: "Lugungu" },
  { code: "ruc", name: "Ruruuli" },
  { code: "rwm", name: "Kwamba" },
  { code: "swa", name: "Swahili" },
  { code: "teo", name: "Ateso" },
  { code: "tlj", name: "Lubwisi" },
  { code: "xog", name: "Lusoga" }
];

export const nllbTranslationCodes = ["ach", "teo", "lug", "lgg", "nyn"];

export const nllbTargetLanguages = targetLanguages.filter((language) =>
  nllbTranslationCodes.includes(language.code)
);

export const sunbirdSupportedCodes = [
  "ach", "eng", "ibo", "lgg", "lug", "nyn", "swa", "teo",
  "xog", "kin", "myx", "adh", "alz", "bfa", "cgg", "gwr",
  "kdi", "kdj", "keo", "koo", "kpz", "laj", "lsm", "luc",
  "mhi", "pok", "rub", "ruc", "rwm", "tlj", "nuj", "nyo"
];

export function getSupportedLanguage(code) {
  const normalizedCode = (code || "").trim().toLowerCase();
  return [sourceLanguage, ...targetLanguages].find((language) => language.code === normalizedCode);
}

export function getNllbSupportedLanguage(code) {
  const normalizedCode = (code || "").trim().toLowerCase();
  return [sourceLanguage, ...nllbTargetLanguages].find((language) => language.code === normalizedCode);
}

export function getLanguages() {
  return {
    sourceLanguage,
    targetLanguages: nllbTargetLanguages,
    allLanguages: [sourceLanguage, ...targetLanguages],
    capabilities: {
      nllbTranslate: [sourceLanguage, ...nllbTargetLanguages],
      referenceLanguages: [sourceLanguage, ...targetLanguages]
    }
  };
}
