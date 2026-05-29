import { fetchCourses } from "../thinkific/fetchCourses.js";

export async function fetchCommand() {
  const courses = await fetchCourses();
  console.log(JSON.stringify({ courses }, null, 2));
}
