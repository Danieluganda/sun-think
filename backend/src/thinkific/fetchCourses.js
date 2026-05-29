import { thinkificRequest } from "./client.js";
import { COURSES_QUERY } from "./queries.js";

export async function fetchCourses({ first = 50 } = {}) {
  const data = await thinkificRequest(COURSES_QUERY, { first, after: null });
  return data.site.courses.nodes.map((course) => ({
    id: course.id,
    name: course.name,
    slug: course.slug || "",
    description: course.description || ""
  }));
}
