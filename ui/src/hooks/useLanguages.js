import { useEffect, useState } from "react";
import { getLanguages } from "../api/languages.js";
import { fallbackLanguages } from "../utils/constants.js";

export function useLanguages() {
  const [state, setState] = useState({
    sourceLanguage: fallbackLanguages.sourceLanguage,
    targetLanguages: fallbackLanguages.targetLanguages,
    loading: true,
    error: ""
  });

  useEffect(() => {
    let mounted = true;

    getLanguages()
      .then((payload) => {
        if (!mounted) return;
        setState({
          sourceLanguage: payload.sourceLanguage,
          targetLanguages: payload.targetLanguages,
          loading: false,
          error: ""
        });
      })
      .catch((error) => {
        if (!mounted) return;
        setState({
          sourceLanguage: fallbackLanguages.sourceLanguage,
          targetLanguages: fallbackLanguages.targetLanguages,
          loading: false,
          error: error.message
        });
      });

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
