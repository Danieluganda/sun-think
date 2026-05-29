import { useEffect, useState } from "react";
import { getMetrics } from "../api/metrics.js";

const emptyMetrics = {
  counters: {},
  apis: [],
  recentCalls: []
};

export function useMetrics({ pollMs = 0 } = {}) {
  const [state, setState] = useState({ metrics: emptyMetrics, loading: true, error: "" });

  useEffect(() => {
    let mounted = true;

    async function load() {
      getMetrics()
        .then((metrics) => mounted && setState({ metrics, loading: false, error: "" }))
        .catch((error) => mounted && setState({ metrics: emptyMetrics, loading: false, error: error.message }));
    }

    load();
    const interval = pollMs ? setInterval(load, pollMs) : null;

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [pollMs]);

  return state;
}
