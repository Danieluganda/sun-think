import { useEffect, useState } from "react";
import { getCourses } from "../api/courses.js";
import { coursesFallback } from "../store/coursesStore.js";

export function useCourses() {
  const [state, setState] = useState({ courses: [], loading: true, error: "" });

  useEffect(() => {
    let mounted = true;
    getCourses()
      .then((payload) => mounted && setState({ courses: payload.courses, loading: false, error: "" }))
      .catch((error) =>
        mounted && setState({ courses: coursesFallback, loading: false, error: error.message })
      );
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
