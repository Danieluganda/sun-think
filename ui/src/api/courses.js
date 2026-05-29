import { apiRequest } from "./client.js";

export function getCourses() {
  return apiRequest("/courses");
}

export function getLessons(courseId) {
  return apiRequest(`/courses/${courseId}/lessons`);
}

export function getCaptions(lessonId) {
  return apiRequest(`/courses/lessons/${lessonId}/captions`);
}
