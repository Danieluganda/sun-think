import express from "express";
import { addProtectedTerm, getProtectedTerms, removeProtectedTerm } from "../../protectedTerms/store.js";

export const publicProtectedTermsRouter = express.Router();
export const protectedTermsRouter = express.Router();

publicProtectedTermsRouter.get("/", (_req, res) => {
  const { terms, updatedAt } = getProtectedTerms();
  res.json({ terms, updatedAt });
});

protectedTermsRouter.get("/", (_req, res) => {
  res.json(getProtectedTerms());
});

protectedTermsRouter.post("/", (req, res, next) => {
  try {
    res.status(201).json(addProtectedTerm(req.body?.term));
  } catch (error) {
    next(error);
  }
});

protectedTermsRouter.delete("/", (req, res, next) => {
  try {
    res.json(removeProtectedTerm(req.body?.term));
  } catch (error) {
    next(error);
  }
});
