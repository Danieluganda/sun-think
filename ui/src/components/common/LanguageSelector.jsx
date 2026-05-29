import { Check } from "lucide-react";
import { targetLanguages } from "../../utils/constants.js";

export function LanguageSelector({ selected, onChange }) {
  function toggle(code) {
    if (selected.includes(code)) {
      onChange(selected.filter((item) => item !== code));
      return;
    }
    onChange([...selected, code]);
  }

  return (
    <div className="language-selector" aria-label="Target languages">
      {targetLanguages.map((language) => {
        const active = selected.includes(language.code);
        return (
          <button
            className={`language-chip ${active ? "active" : ""}`}
            key={language.code}
            onClick={() => toggle(language.code)}
            type="button"
          >
            {active ? <Check size={14} /> : null}
            <span>{language.name}</span>
          </button>
        );
      })}
    </div>
  );
}
