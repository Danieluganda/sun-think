import assert from "node:assert/strict";
import test from "node:test";
import { chunkCues } from "../src/sunbird/chunker.js";

test("chunks cues by character budget", () => {
  const cues = [
    { text: "aaaa" },
    { text: "bbbb" },
    { text: "cccc" }
  ];

  const chunks = chunkCues(cues, { maxCharacters: 10 });
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].length, 2);
  assert.equal(chunks[1].length, 1);
});
