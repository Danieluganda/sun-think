import express from "express";
import { fetchCourses } from "../../thinkific/fetchCourses.js";
import { fetchLessons } from "../../thinkific/fetchLessons.js";
import { fetchCaptions } from "../../thinkific/fetchCaptions.js";

export const coursesRouter = express.Router();

coursesRouter.get("/", async (_req, res, next) => {
  try {
    res.json({ courses: await fetchCourses() });
  } catch (error) {
    next(error);
  }
});

coursesRouter.get("/lessons/:lessonId/captions", async (req, res, next) => {
  try {
    res.json({ captions: await fetchCaptions(req.params.lessonId) });
  } catch (error) {
    next(error);
  }
});

coursesRouter.get("/:courseId/lessons", async (req, res, next) => {
  try {
    res.json({ lessons: await fetchLessons(req.params.courseId) });
  } catch (error) {
    next(error);
  }
});
