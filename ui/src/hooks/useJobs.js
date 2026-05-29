import { useEffect, useState } from "react";
import { getJobs } from "../api/jobs.js";
import { jobsFallback } from "../store/jobsStore.js";

export function useJobs({ pollMs = 0 } = {}) {
  const [state, setState] = useState({ jobs: [], loading: true, error: "" });

  useEffect(() => {
    let mounted = true;
    async function load() {
      getJobs()
        .then((payload) => mounted && setState({ jobs: payload.jobs, loading: false, error: "" }))
        .catch((error) => mounted && setState({ jobs: jobsFallback, loading: false, error: error.message }));
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
