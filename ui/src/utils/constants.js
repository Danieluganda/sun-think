export const navItems = [
  { id: "monitor", label: "Monitor" },
  { id: "courses", label: "Courses" },
  { id: "lessons", label: "Lessons" },
  { id: "jobs", label: "Jobs" },
  { id: "export", label: "Export" }
];

export const fallbackLanguages = {
  sourceLanguage: { code: "eng", name: "English" },
  targetLanguages: [
    { code: "ach", name: "Acholi" },
    { code: "teo", name: "Ateso" },
    { code: "lug", name: "Luganda" },
    { code: "lgg", name: "Lugbara" },
    { code: "nyn", name: "Runyankole" }
  ]
};

export const targetLanguages = fallbackLanguages.targetLanguages;

export const learnerUrl = "https://10xacademy.outbox.africa/";
