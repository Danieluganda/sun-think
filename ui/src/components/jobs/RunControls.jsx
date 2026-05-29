import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "../common/Button.jsx";
import { LanguageSelector } from "../common/LanguageSelector.jsx";

export function RunControls({ selectedLanguages, onLanguagesChange, onStart, onRetry, paused, onPauseToggle }) {
  return (
    <section className="run-controls">
      <div>
        <h2>Translation run</h2>
        <p>Select target languages, then start or resume queued caption jobs.</p>
      </div>
      <LanguageSelector selected={selectedLanguages} onChange={onLanguagesChange} />
      <div className="action-row">
        <Button icon={Play} onClick={onStart}>Start</Button>
        <Button icon={paused ? Play : Pause} onClick={onPauseToggle} variant="secondary">
          {paused ? "Resume" : "Pause"}
        </Button>
        <Button icon={RotateCcw} onClick={onRetry} variant="secondary">Retry failed</Button>
      </div>
    </section>
  );
}
