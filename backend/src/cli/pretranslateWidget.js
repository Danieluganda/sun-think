import { nllbTargetLanguages, sourceLanguage } from "../../config/languages.js";
import { fetchCourses } from "../thinkific/fetchCourses.js";
import { fetchLessons } from "../thinkific/fetchLessons.js";
import { translateTexts } from "../translation/translateTexts.js";

const defaultStaticText = [
  "Course Curriculum",
  "About this course",
  "Welcome to the 10X Foundation course!",
  "Show more",
  "Start Course",
  "lessons",
  "This course is free."
];

function readArg(args, name) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : "";
}

function readListArg(args, name) {
  const value = readArg(args, name);
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function addText(set, value) {
  const text = stripHtml(value);
  if (text.length >= 2 && text.length <= 500) set.add(text);
}

async function collectCourseTexts({ courseId, courseSlug }) {
  const courses = await fetchCourses();
  const selectedCourses = courses.filter((course) => {
    if (courseId) return course.id === courseId;
    if (courseSlug) return course.slug === courseSlug;
    return true;
  });

  if (!selectedCourses.length) {
    throw new Error("No Thinkific courses matched the requested filter");
  }

  const texts = new Set(defaultStaticText);

  for (const course of selectedCourses) {
    addText(texts, course.name);
    addText(texts, course.description);

    const lessons = await fetchLessons(course.id);
    lessons.forEach((lesson) => {
      addText(texts, lesson.title);
      addText(texts, lesson.courseName);
    });
  }

  return {
    courses: selectedCourses,
    texts: [...texts]
  };
}

export async function pretranslateWidgetCommand(args) {
  const courseId = readArg(args, "course");
  const courseSlug = readArg(args, "slug");
  const requestedLanguages = readListArg(args, "languages");
  const concurrency = Number(readArg(args, "concurrency") || process.env.TRANSLATION_CONCURRENCY || 3);
  const languages = requestedLanguages.length
    ? nllbTargetLanguages.filter((language) => requestedLanguages.includes(language.code))
    : nllbTargetLanguages;

  if (!languages.length) {
    throw new Error("No supported target languages selected");
  }

  const { courses, texts } = await collectCourseTexts({ courseId, courseSlug });
  const results = [];

  for (const language of languages) {
    const startedAt = Date.now();
    const result = await translateTexts({
      texts,
      sourceLanguage: sourceLanguage.code,
      targetLanguage: language.code,
      concurrency
    });

    results.push({
      language: language.code,
      label: language.name,
      textCount: texts.length,
      cache: result.cache,
      durationMs: Date.now() - startedAt
    });
  }

  console.log(JSON.stringify({
    courses: courses.map((course) => ({ id: course.id, name: course.name, slug: course.slug })),
    sourceLanguage: sourceLanguage.code,
    languages: results
  }, null, 2));
}
