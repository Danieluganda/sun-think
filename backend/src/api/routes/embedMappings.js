import express from "express";
import { getEmbedMappings, removeEmbedMapping, upsertEmbedMapping } from "../../embedMappings/store.js";

export const publicEmbedMappingsRouter = express.Router();
export const embedMappingsRouter = express.Router();

publicEmbedMappingsRouter.get("/", (_req, res) => {
  const { mappings, updatedAt } = getEmbedMappings();
  res.json({ mappings, updatedAt });
});

embedMappingsRouter.get("/", (_req, res) => {
  res.json(getEmbedMappings());
});

embedMappingsRouter.post("/", (req, res, next) => {
  try {
    res.status(201).json(upsertEmbedMapping(req.body || {}));
  } catch (error) {
    next(error);
  }
});

embedMappingsRouter.delete("/:id", (req, res, next) => {
  try {
    res.json(removeEmbedMapping(req.params.id));
  } catch (error) {
    next(error);
  }
});
