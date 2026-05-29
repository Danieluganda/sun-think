import express from "express";
import { getLanguages } from "../../../config/languages.js";

export const languagesRouter = express.Router();

languagesRouter.get("/", (_req, res) => {
  res.json(getLanguages());
});
